import type { Context, Hono } from 'hono';
import type { AppEnv } from '../../types';
import { MeController } from './me.controller';

/**
 * Регистрация маршрутов модуля me — единственный вход в модуль снаружи
 * (MODULE_HAS_ONE_ENTRY). Ручка закрыта: её нет в `OPEN_ROUTES`.
 */
export const registerMeRoutes = (app: Hono<AppEnv>): void => {
  app.get('/me', (context: Context<AppEnv>): Response => {
    const controller: MeController = new MeController();
    return controller.show(context);
  });
};
