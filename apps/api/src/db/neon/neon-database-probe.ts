import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
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
 * Сверяет код с журналом базы (SCHEMA_MATCHES_CODE): `latestMigrationHash` — хеш
 * последней миграции из `apps/api/drizzle/` на момент сборки, журнал —
 * `drizzle.__drizzle_migrations`. Запись с этим хешем обязана быть в журнале.
 *
 * Одного хеша достаточно: миграции применяются по порядку одной транзакцией, а пропуск
 * более ранней ловит `db:migrate` при деплое (NO_MIGRATION_IS_SKIPPED). Записи журнала
 * новее этой сбоем не считаются: база новее кода в окне между миграцией и публикацией
 * деплоя, и это штатно.
 *
 * Соединения нет: каждый запрос — отдельный HTTP-вызов, объект ничего не держит.
 * Ответа ждёт ограниченное время: зависшая база — тоже «недоступна».
 */
export class NeonDatabaseProbe implements DatabaseProbe {
  private readonly db: NeonHttpDatabase;
  private readonly latestMigrationHash: string | null;
  private readonly timeoutMs: number;

  constructor(
    databaseUrl: string,
    latestMigrationHash: string | null,
    timeoutMs: number = DATABASE_PROBE_TIMEOUT_MS,
  ) {
    configureNeonFor(databaseUrl);
    this.db = drizzle(databaseUrl);
    this.latestMigrationHash = latestMigrationHash;
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
    let applied: boolean;
    try {
      applied = await this.isLatestMigrationApplied();
    } catch (cause) {
      const reason: DatabaseFailure = this.isMissingJournal(cause) ? 'schema_behind' : 'database_unavailable';
      return { ok: false, reason, cause };
    }
    if (applied) return { ok: true };
    const cause: Error = new Error('в журнале базы нет последней миграции кода');
    return { ok: false, reason: 'schema_behind', cause };
  }

  /** Миграций в коде нет — сверять нечего, проверяется только связь с базой. */
  private async isLatestMigrationApplied(): Promise<boolean> {
    const hash: string | null = this.latestMigrationHash;
    const query: SQL =
      hash === null
        ? sql`select 1`
        : sql`select 1 from drizzle.__drizzle_migrations where hash = ${hash} limit 1`;
    const result: { rows: unknown[] } = await this.db.execute(query);
    return result.rows.length > 0;
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
