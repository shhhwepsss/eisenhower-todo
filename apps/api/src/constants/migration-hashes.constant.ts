/**
 * Хеши миграций из `apps/api/drizzle/` на момент сборки (docs/specs/51-db-migrations.md).
 * Подставляет Vite (`define`): в функцию едут только хеши, сами файлы миграций — нет
 * (MIGRATIONS_STAY_OUT_OF_FUNCTION). По ним `/api/health` сверяет код с журналом базы.
 */
export const MIGRATION_HASHES: readonly string[] = __MIGRATION_HASHES__;
