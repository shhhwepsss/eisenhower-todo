import { DATABASE_CHECK_TTL_MS } from '../constants/database-check.constant';
import type { DatabaseCheck, DatabaseProbe } from '../types';

/**
 * Проверка базы с памятью (docs/specs/51-db-migrations.md): успешный результат
 * запоминается на срок, и до его истечения настоящая проверка не вызывается.
 *
 * Запоминается только успех. Сбой перепроверяется на каждом запросе: как только база
 * вернулась, ручка сообщает об этом сразу, а не через срок.
 *
 * Память живёт в инстансе функции и пропадает вместе с ним — холодный старт проверяет
 * базу заново.
 */
export class CachedDatabaseProbe implements DatabaseProbe {
  private readonly probe: DatabaseProbe;
  private readonly ttlMs: number;
  private healthyUntil: number = 0;

  constructor(probe: DatabaseProbe, ttlMs: number = DATABASE_CHECK_TTL_MS) {
    this.probe = probe;
    this.ttlMs = ttlMs;
  }

  public async check(): Promise<DatabaseCheck> {
    if (Date.now() < this.healthyUntil) return { ok: true };
    const check: DatabaseCheck = await this.probe.check();
    if (check.ok) this.healthyUntil = Date.now() + this.ttlMs;
    return check;
  }
}
