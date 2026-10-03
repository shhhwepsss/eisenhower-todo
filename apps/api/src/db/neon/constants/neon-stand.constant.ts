/**
 * Локальный стенд базы (apps/api/stand/docker-compose.yml). Имя резолвится в 127.0.0.1;
 * по нему код отличает стенд от настоящего Neon.
 */
export const STAND_HOST: string = 'db.localtest.me';

/** Порт прокси Neon на стенде: и HTTP (`/sql`), и WebSocket (`/v2`). */
export const STAND_PROXY_PORT: number = 4444;
