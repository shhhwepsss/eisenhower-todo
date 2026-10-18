import type { Context } from 'hono';
import { createLog } from '../logger';
import type { AppEnv, ErrorBody, Logger } from '../types';

/**
 * Общие ответы об ошибке (docs/specs/60-api-modules.md): они не принадлежат ни одному
 * модулю, поэтому живут рядом со сборкой приложения, а не в `modules/`.
 */
const log: Logger = createLog('api/app');

/**
 * Неизвестный путь под `/api` — JSON, а не HTML фронта: клиент API разбирает ответ
 * одинаково для любой ошибки.
 */
export const respondNotFound = (context: Context<AppEnv>): Response => {
  log.debug('нет такой ручки', { method: context.req.method, path: context.req.path });
  const body: ErrorBody = { error: 'not_found' };
  return context.json(body, 404);
};

/**
 * Запрос без сессии к закрытой ручке (AUTH_REQUIRED_BY_DEFAULT,
 * docs/specs/52-google-auth.md). Лог пишет `requireSession`: он знает, почему отказал.
 */
export const respondUnauthorized = (context: Context<AppEnv>): Response => {
  const body: ErrorBody = { error: 'unauthorized' };
  return context.json(body, 401);
};

/**
 * Необработанное исключение. Лог пишется здесь, потому что здесь ошибка и
 * обработана (CLAUDE.md §9); наружу уходит только код, без стека и сообщения.
 */
export const respondInternalError = (error: Error, context: Context<AppEnv>): Response => {
  log.error('ручка упала', { method: context.req.method, path: context.req.path, error });
  const body: ErrorBody = { error: 'internal' };
  return context.json(body, 500);
};
