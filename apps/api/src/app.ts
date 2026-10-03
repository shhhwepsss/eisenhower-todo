import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { BUILD_VERSION } from './constants/build-version.constant';
import { readEnv } from './lib/env.lib';
import { createLog } from './logger';
import type { EnvResult, ErrorBody, HealthBody, Logger } from './types';

/**
 * Приложение API (docs/specs/50-api-skeleton.md). Одно на функцию Netlify и на
 * dev-сервер: обработчик функции и dev-сервер только передают сюда `Request`.
 *
 * Netlify-специфичного здесь нет — второй аргумент обработчика (`Context` Netlify)
 * не используется (`API_IGNORES_NETLIFY_CONTEXT`), поэтому dev-сервер ведёт себя
 * как прод.
 */
const log: Logger = createLog('api/app');

// TODO(#60): обработчики запросов разнести по модулям (маршрут, контроллер, ответ),
// а не держать инлайн-функциями в этом файле — новые ручки (#46, #51, #52) должны
// добавляться модулем, а не ростом app.ts. Здесь останется только сборка приложения.

/**
 * ENV_FAILS_FAST (docs/specs/51-db-migrations.md): ни одна ручка не выполняется с
 * неразобранным окружением. В лог уходят имена переменных, наружу — общий `internal`:
 * какие переменные у сервера есть, клиенту знать незачем.
 */
const requireEnv = async (c: Context, next: Next): Promise<Response | void> => {
  const result: EnvResult = readEnv();
  if (result.ok) return next();
  log.error('окружение не разобрано', { variables: result.variables });
  const body: ErrorBody = { error: 'internal' };
  return c.json(body, 500);
};

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

app.use('*', requireEnv);
app.get('/health', respondHealth);
app.notFound(respondNotFound);
app.onError(respondInternalError);
