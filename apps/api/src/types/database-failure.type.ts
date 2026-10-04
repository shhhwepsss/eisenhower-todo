/**
 * Почему проверка базы не прошла (docs/specs/51-db-migrations.md). Уходит в ответ
 * `/api/health` как `status`:
 *
 * - `database_unavailable` — до базы не достучались: не отвечает, отказала, не успела;
 * - `schema_behind` — база отвечает, но в её журнале нет миграций, с которыми собран код.
 */
export type DatabaseFailure = 'database_unavailable' | 'schema_behind';
