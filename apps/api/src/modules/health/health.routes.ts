import type { Context, Hono } from 'hono';
import type { AppDeps, AppEnv, Env } from '../../types';
import { composeHealthController } from './health.composition';
import type { HealthController } from './health.controller';

/**
 * Регистрация маршрутов модуля health — единственный вход в модуль снаружи
 * (MODULE_HAS_ONE_ENTRY, docs/specs/60-api-modules.md). Пути — относительно `/api`.
 *
 * Окружение на запросе уже разобрано: его кладёт `requireEnv` (ENV_FAILS_FAST).
 */
export const registerHealthRoutes = (app: Hono<AppEnv>, deps: AppDeps): void => {
  app.get('/health', (context: Context<AppEnv>): Promise<Response> => {
    const env: Env = context.get('env');
    const controller: HealthController = composeHealthController(deps, env);
    return controller.check(context);
  });
};
