import { Hono } from 'hono';
import type { Context } from 'hono';
import { BUILD_VERSION } from './constants/build-version.constant';
import { createLog } from './logger';
import type { ErrorBody, HealthBody, Logger } from './types';

/**
 * Приложение API (docs/specs/50-api-skeleton.md). Одно на функцию Netlify и на
 * dev-сервер: обработчик функции и dev-сервер только передают сюда `Request`.
 *
 * Netlify-специфичного здесь нет — второй аргумент обработчика (`Context` Netlify)
 * не используется (`API_IGNORES_NETLIFY_CONTEXT`), поэтому dev-сервер ведёт себя
 * как прод.
 */
const log: Logger = createLog('api/app');

const respondHealth = (c: Context): Response => {
  const body: HealthBody = { status: 'ok', version: BUILD_VERSION };
  return c.json(body);
};

/**
 * Неизвестный путь под `/api` — JSON, а не HTML фронта: клиент API разбирает ответ
 * одинаково для любой ошибки.
 */
const respondNotFound = (c: Context): Response => {
  log.debug('нет такой ручки', { method: c.req.method, path: c.req.path });
  const body: ErrorBody = { error: 'not_found' };
  return c.json(body, 404);
};

/**
 * Необработанное исключение. Лог пишется здесь, потому что здесь ошибка и
 * обработана (CLAUDE.md §9); наружу уходит только код, без стека и сообщения.
 */
const respondInternalError = (error: Error, c: Context): Response => {
  log.error('ручка упала', { method: c.req.method, path: c.req.path, error });
  const body: ErrorBody = { error: 'internal' };
  return c.json(body, 500);
};

export const app: Hono = new Hono().basePath('/api');

app.get('/health', respondHealth);
app.notFound(respondNotFound);
app.onError(respondInternalError);
