import { Hono } from 'hono';
import type { MiddlewareHandler } from 'hono';
import { API_BASE_PATH } from './constants/api-paths.constant';
import { createAuthConfigMiddleware } from './http/auth-config.middleware';
import { respondInternalError, respondNotFound } from './http/error.responder';
import { requireEnv } from './http/require-env.middleware';
import { requireSession } from './http/require-session.middleware';
import { registerAuthRoutes } from './modules/auth/auth.routes';
import { registerHealthRoutes } from './modules/health/health.routes';
import { registerMeRoutes } from './modules/me/me.routes';
import type { AppDeps, AppEnv } from './types';

/**
 * Сборка приложения API (docs/specs/50-api-skeleton.md, docs/specs/60-api-modules.md).
 * Здесь только порядок: общий middleware, маршруты модулей, общие ответы об ошибке.
 * Новая ручка — это новый модуль в `modules/` и одна строка регистрации здесь.
 *
 * Порядок middleware (docs/specs/52-google-auth.md): окружение → конфиг Auth.js →
 * сессия. Новая ручка закрыта без единой строки в ней самой (AUTH_REQUIRED_BY_DEFAULT);
 * открывает её только `OPEN_ROUTES`.
 *
 * Зависимости приходят аргументом: настоящие подставляет `app.ts`, тест — свои. О Drizzle
 * и Neon этот файл не знает (DB_BEHIND_INTERFACE, docs/specs/51-db-migrations.md).
 *
 * Netlify-специфичного здесь нет — второй аргумент обработчика (`Context` Netlify)
 * не используется (`API_IGNORES_NETLIFY_CONTEXT`), поэтому dev-сервер ведёт себя
 * как прод.
 */
export const createApp = (deps: AppDeps): Hono<AppEnv> => {
  const app: Hono<AppEnv> = new Hono<AppEnv>().basePath(API_BASE_PATH);
  const authConfigMiddleware: MiddlewareHandler = createAuthConfigMiddleware(deps);

  app.use('*', requireEnv);
  app.use('*', authConfigMiddleware);
  app.use('*', requireSession);
  registerAuthRoutes(app);
  registerHealthRoutes(app, deps);
  registerMeRoutes(app);
  app.notFound(respondNotFound);
  app.onError(respondInternalError);

  return app;
};
