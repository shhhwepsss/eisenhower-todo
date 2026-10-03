import type { DatabaseCheck } from './database-check.type';

/**
 * «База доступна, и в ней применены все миграции кода» (docs/specs/51-db-migrations.md).
 * Приложение зависит от этого контракта, а не от Drizzle и Neon (DB_BEHIND_INTERFACE).
 */
export interface DatabaseProbe {
  check(): Promise<DatabaseCheck>;
}
