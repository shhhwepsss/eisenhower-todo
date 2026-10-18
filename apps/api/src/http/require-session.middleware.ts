import type { JWT } from '@auth/core/jwt';
import type { AuthUser } from '@hono/auth-js';
import { getAuthUser } from '@hono/auth-js';
import type { Context, Next } from 'hono';
import { matchedRoutes } from 'hono/route';
import type { RouterRoute } from 'hono/types';
import { GLOBAL_MIDDLEWARE_PATH } from '../constants/api-paths.constant';
import { OPEN_ROUTES } from '../constants/open-routes.constant';
import { createLog } from '../logger';
import type { AppEnv, Logger, OpenRoute, SessionUser } from '../types';
import { respondUnauthorized } from './error.responder';
import { toSessionUser } from './mappers/session-user.mapper';
import type { SessionToken } from './types';

const log: Logger = createLog('api/session');

const isGlobalMiddleware = (route: RouterRoute): boolean => {
  return route.method === 'ALL' && route.path === GLOBAL_MIDDLEWARE_PATH;
};

const isOpenRoute = (route: RouterRoute): boolean => {
  return OPEN_ROUTES.some((open: OpenRoute) => open.method === route.method && open.path === route.path);
};

const isSessionToken = (token: JWT | undefined): token is SessionToken => typeof token?.sub === 'string';

/** JWT сессии с идентификатором пользователя; `null`, если сессии нет или она не наша. */
const readSessionToken = async (context: Context<AppEnv>): Promise<SessionToken | null> => {
  const authUser: AuthUser | null = await getAuthUser(context);
  const token: JWT | undefined = authUser?.token;
  return isSessionToken(token) ? token : null;
};

/**
 * AUTH_REQUIRED_BY_DEFAULT и UNKNOWN_PATH_IS_NOT_FOUND (docs/specs/52-google-auth.md).
 * Hono уже знает, какие маршруты совпали с запросом, и решение принимается по ним:
 *
 * 1. Совпали только глобальные middleware — обработчика нет. Запрос идёт дальше и
 *    получает `404` от `respondNotFound`, есть сессия или нет.
 * 2. Каждый совпавший обработчик — в `OPEN_ROUTES` (метод и путь): сессия не нужна.
 * 3. Иначе нужна сессия, без неё — `401`.
 *
 * Глобальным middleware считается только маршрут `ALL` с путём `/api/*`: ручка,
 * заведённая через `app.all('/x', …)`, — обработчик и закрыта, как любая другая.
 *
 * Сессия — JWT в cookie; проверка его только расшифровывает и в базу не ходит
 * (SESSION_CHECK_SKIPS_DATABASE).
 */
export const requireSession = async (context: Context<AppEnv>, next: Next): Promise<Response | void> => {
  const routes: RouterRoute[] = matchedRoutes(context);
  const handlers: RouterRoute[] = routes.filter((route: RouterRoute) => !isGlobalMiddleware(route));
  if (handlers.length === 0) return next();
  if (handlers.every(isOpenRoute)) return next();
  const token: SessionToken | null = await readSessionToken(context);
  if (token === null) {
    log.debug('нет сессии', { method: context.req.method, path: context.req.path });
    return respondUnauthorized(context);
  }
  const sessionUser: SessionUser = toSessionUser(token);
  context.set('sessionUser', sessionUser);
  return next();
};
