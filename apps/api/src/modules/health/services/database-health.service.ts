import type { DatabaseCheck, DatabaseProbe } from '../../../types';

/**
 * Здоровье базы глазами приложения (docs/specs/60-api-modules.md). Зависит от контракта
 * `DatabaseProbe`, а не от Drizzle и Neon (DB_BEHIND_INTERFACE): реализацию подставляет
 * сборка модуля.
 *
 * Ничего не помнит: проверка идёт на каждом вызове, сервис сообщает состояние базы
 * сейчас, а не минуту назад (docs/specs/51-db-migrations.md).
 */
export class DatabaseHealthService {
  private readonly probe: DatabaseProbe;

  constructor(probe: DatabaseProbe) {
    this.probe = probe;
  }

  public check(): Promise<DatabaseCheck> {
    return this.probe.check();
  }
}
