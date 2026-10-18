import { authHandler } from '@hono/auth-js';
import type { Hono, MiddlewareHandler } from 'hono';
import { AUTH_PATH } from '../../constants/api-paths.constant';
import type { AppEnv } from '../../types';

/**
 * Ручки Auth.js (docs/specs/52-google-auth.md): вход, выход, колбэк Google, сессия.
 * Вся логика — внутри библиотеки, у модуля нет ни контроллера, ни use-case. Путь
 * совпадает с путём `AUTH_URL`, это проверяет `ENV_SCHEMA`. Открыт без сессии —
 * `OPEN_ROUTES`.
 */
export const registerAuthRoutes = (app: Hono<AppEnv>): void => {
  const handler: MiddlewareHandler = authHandler();
  app.on(['GET', 'POST'], `${AUTH_PATH}/*`, handler);
};
