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
export const respondNotFound = (c: Context<AppEnv>): Response => {
  log.debug('нет такой ручки', { method: c.req.method, path: c.req.path });
  const body: ErrorBody = { error: 'not_found' };
  return c.json(body, 404);
};

/**
 * Необработанное исключение. Лог пишется здесь, потому что здесь ошибка и
 * обработана (CLAUDE.md §9); наружу уходит только код, без стека и сообщения.
 */
export const respondInternalError = (error: Error, c: Context<AppEnv>): Response => {
  log.error('ручка упала', { method: c.req.method, path: c.req.path, error });
  const body: ErrorBody = { error: 'internal' };
  return c.json(body, 500);
};
