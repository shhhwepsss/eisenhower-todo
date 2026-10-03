/**
 * Хеш последней миграции из `apps/api/drizzle/` на момент сборки
 * (docs/specs/51-db-migrations.md); `null`, если миграций нет. Подставляет Vite (`define`):
 * в функцию едет один хеш, сами файлы миграций — нет (MIGRATIONS_STAY_OUT_OF_FUNCTION).
 * По нему `/api/health` сверяет код с журналом базы.
 */
export const LATEST_MIGRATION_HASH: string | null = __LATEST_MIGRATION_HASH__;
