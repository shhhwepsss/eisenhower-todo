import type { Env } from './env.type';
import type { SessionUser } from './session-user.type';

/**
 * Переменные запроса Hono: разобранное окружение кладёт `requireEnv`, вошедшего
 * пользователя — `requireSession`. На открытых ручках сессию не проверяют, поэтому
 * `sessionUser` может быть не задан.
 */
export type AppEnv = { Variables: { env: Env; sessionUser?: SessionUser } };
