/**
 * Сколько проверка базы ждёт ответа (docs/specs/51-db-migrations.md). Без предела
 * зависшая база держала бы `/api/health` до лимита функции, и вместо
 * `database_unavailable` клиент получал бы таймаут платформы. Десяти секунд хватает
 * базе Neon, чтобы проснуться после простоя.
 */
export const DATABASE_PROBE_TIMEOUT_MS: number = 10_000;
