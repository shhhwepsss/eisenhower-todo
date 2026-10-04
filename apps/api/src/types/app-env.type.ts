import type { Env } from './env.type';

/** Переменные запроса Hono: разобранное окружение кладёт `requireEnv`. */
export type AppEnv = { Variables: { env: Env } };
