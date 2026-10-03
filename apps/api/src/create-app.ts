import { Hono } from 'hono';
import { respondInternalError, respondNotFound } from './http/error.responder';
import { requireEnv } from './http/require-env.middleware';
import { registerHealthRoutes } from './modules/health/health.routes';
import type { AppDeps, AppEnv } from './types';

/**
 * Сборка приложения API (docs/specs/50-api-skeleton.md, docs/specs/60-api-modules.md).
 * Здесь только порядок: общий middleware, маршруты модулей, общие ответы об ошибке.
 * Новая ручка — это новый модуль в `modules/` и одна строка регистрации здесь.
 *
 * Зависимости приходят аргументом: настоящие подставляет `app.ts`, тест — свои. О Drizzle
 * и Neon этот файл не знает (DB_BEHIND_INTERFACE, docs/specs/51-db-migrations.md).
 *
 * Netlify-специфичного здесь нет — второй аргумент обработчика (`Context` Netlify)
 * не используется (`API_IGNORES_NETLIFY_CONTEXT`), поэтому dev-сервер ведёт себя
 * как прод.
 */
export const createApp = (deps: AppDeps): Hono<AppEnv> => {
  const app: Hono<AppEnv> = new Hono<AppEnv>().basePath('/api');

  app.use('*', requireEnv);
  registerHealthRoutes(app, deps);
  app.notFound(respondNotFound);
  app.onError(respondInternalError);

  return app;
};
