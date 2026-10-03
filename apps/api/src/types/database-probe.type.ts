import type { DatabaseCheck } from './database-check.type';

/**
 * «База доступна, и схема в ней применена» (docs/specs/51-db-migrations.md).
 * Приложение зависит от этого контракта, а не от Drizzle и Neon (DB_BEHIND_INTERFACE).
 */
export interface DatabaseProbe {
  check(): Promise<DatabaseCheck>;
}
