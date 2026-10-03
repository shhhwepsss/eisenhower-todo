import { drizzle } from 'drizzle-orm/neon-http';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DatabaseCheck, DatabaseProbe } from '../types';
import { DATABASE_PROBE_TIMEOUT_MS } from './constants/database-probe.constant';
import { configureNeonFor } from './neon-stand';
import { appMeta } from './schema';

/**
 * Проверка базы через HTTP-драйвер Neon — тот же, которым пойдут рабочие запросы
 * (docs/specs/51-db-migrations.md). Читает служебную таблицу: запрос проходит, только
 * если база доступна и первая миграция применена.
 *
 * Соединения нет: каждый запрос — отдельный HTTP-вызов, объект ничего не держит.
 *
 * Ответа ждёт ограниченное время: зависшая база — тоже «недоступна»
 * (DATABASE_FAILURE_IS_REPORTED).
 */
export class NeonDatabaseProbe implements DatabaseProbe {
  private readonly db: NeonHttpDatabase;
  private readonly timeoutMs: number;

  constructor(databaseUrl: string, timeoutMs: number = DATABASE_PROBE_TIMEOUT_MS) {
    configureNeonFor(databaseUrl);
    this.db = drizzle(databaseUrl);
    this.timeoutMs = timeoutMs;
  }

  public async check(): Promise<DatabaseCheck> {
    let timer: NodeJS.Timeout | undefined = undefined;
    const timeout: Promise<DatabaseCheck> = new Promise((resolve) => {
      const cause: Error = new Error(`база не ответила за ${this.timeoutMs} мс`);
      timer = setTimeout(() => resolve({ ok: false, cause }), this.timeoutMs);
    });
    const query: Promise<DatabaseCheck> = this.readServiceTable();
    try {
      return await Promise.race([query, timeout]);
    } finally {
      // Иначе таймер пережил бы ответ и держал бы процесс ещё до десяти секунд.
      clearTimeout(timer);
    }
  }

  private async readServiceTable(): Promise<DatabaseCheck> {
    try {
      await this.db.select({ key: appMeta.key }).from(appMeta).limit(1);
      return { ok: true };
    } catch (cause) {
      return { ok: false, cause };
    }
  }
}
