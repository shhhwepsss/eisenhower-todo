import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DatabaseCheck, DatabaseFailure, DatabaseProbe } from '../../types';
import { DATABASE_PROBE_TIMEOUT_MS } from '../constants/database-probe.constant';
import { UNDEFINED_TABLE_CODE } from '../constants/postgres-error.constant';
import { configureNeonFor } from './neon-stand';

/**
 * Проверка базы через HTTP-драйвер Neon — тот же, которым пойдут рабочие запросы
 * (docs/specs/51-db-migrations.md).
 *
 * Сверяет миграции кода с журналом базы (SCHEMA_MATCHES_CODE): `expectedHashes` — хеши
 * миграций из `apps/api/drizzle/` на момент сборки, журнал — `drizzle.__drizzle_migrations`.
 * Каждая миграция кода обязана быть в журнале. Лишние записи журнала сбоем не считаются:
 * база новее кода в окне между миграцией и публикацией деплоя, и это штатно.
 *
 * Соединения нет: каждый запрос — отдельный HTTP-вызов, объект ничего не держит.
 * Ответа ждёт ограниченное время: зависшая база — тоже «недоступна».
 */
export class NeonDatabaseProbe implements DatabaseProbe {
  private readonly db: NeonHttpDatabase;
  private readonly expectedHashes: readonly string[];
  private readonly timeoutMs: number;

  constructor(
    databaseUrl: string,
    expectedHashes: readonly string[],
    timeoutMs: number = DATABASE_PROBE_TIMEOUT_MS,
  ) {
    configureNeonFor(databaseUrl);
    this.db = drizzle(databaseUrl);
    this.expectedHashes = expectedHashes;
    this.timeoutMs = timeoutMs;
  }

  public async check(): Promise<DatabaseCheck> {
    let timer: NodeJS.Timeout | undefined = undefined;
    const timeout: Promise<DatabaseCheck> = new Promise((resolve) => {
      const cause: Error = new Error(`база не ответила за ${this.timeoutMs} мс`);
      timer = setTimeout(() => resolve({ ok: false, reason: 'database_unavailable', cause }), this.timeoutMs);
    });
    const comparison: Promise<DatabaseCheck> = this.compareWithJournal();
    try {
      return await Promise.race([comparison, timeout]);
    } finally {
      // Иначе таймер пережил бы ответ и держал бы процесс ещё до десяти секунд.
      clearTimeout(timer);
    }
  }

  private async compareWithJournal(): Promise<DatabaseCheck> {
    let applied: Set<unknown>;
    try {
      applied = await this.readAppliedHashes();
    } catch (cause) {
      const reason: DatabaseFailure = this.isMissingJournal(cause) ? 'schema_behind' : 'database_unavailable';
      return { ok: false, reason, cause };
    }
    const missing: string[] = this.expectedHashes.filter((hash) => !applied.has(hash));
    if (missing.length === 0) return { ok: true };
    const cause: Error = new Error(
      `в журнале базы нет ${missing.length} из ${this.expectedHashes.length} миграций кода`,
    );
    return { ok: false, reason: 'schema_behind', cause };
  }

  private async readAppliedHashes(): Promise<Set<unknown>> {
    const journal: { rows: Record<string, unknown>[] } = await this.db.execute(
      sql`select hash from drizzle.__drizzle_migrations`,
    );
    const hashes: unknown[] = journal.rows.map((row) => row.hash);
    return new Set(hashes);
  }

  /**
   * Журнала нет вовсе — базу ни разу не мигрировали. Это отставание схемы, а не
   * недоступность: до базы запрос дошёл. Код ошибки Postgres лежит в самой ошибке или в
   * её `cause` — драйвер и drizzle оборачивают её по-разному.
   */
  private isMissingJournal(error: unknown): boolean {
    let current: unknown = error;
    while (typeof current === 'object' && current !== null) {
      const candidate: { code?: unknown; cause?: unknown } = current;
      if (candidate.code === UNDEFINED_TABLE_CODE) return true;
      current = candidate.cause;
    }
    return false;
  }
}
