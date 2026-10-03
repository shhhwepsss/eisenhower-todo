import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { BUILD_VERSION } from './constants/build-version.constant';
import { readEnv } from './lib/env.lib';
import { createLog } from './logger';
import { CachedDatabaseProbe } from './services/cached-database-probe.service';
import type {
  AppDeps,
  AppEnv,
  DatabaseCheck,
  DatabaseProbe,
  Env,
  EnvResult,
  ErrorBody,
  HealthBody,
  Logger,
} from './types';

/**
 * Сборка приложения API (docs/specs/50-api-skeleton.md). Зависимости приходят
 * аргументом: настоящие подставляет `app.ts`, тест — свои. О Drizzle и Neon этот файл не
 * знает (DB_BEHIND_INTERFACE, docs/specs/51-db-migrations.md).
 *
 * Netlify-специфичного здесь нет — второй аргумент обработчика (`Context` Netlify)
 * не используется (`API_IGNORES_NETLIFY_CONTEXT`), поэтому dev-сервер ведёт себя
 * как прод.
 */
const log: Logger = createLog('api/app');

// TODO(#60): обработчики запросов разнести по модулям (маршрут, контроллер, ответ),
// а не держать инлайн-функциями в этом файле — новые ручки (#46, #51, #52) должны
// добавляться модулем, а не ростом этого файла. Здесь останется только сборка приложения.

/**
 * ENV_FAILS_FAST (docs/specs/51-db-migrations.md): ни одна ручка не выполняется с
 * неразобранным окружением. В лог уходят имена переменных, наружу — общий `internal`:
 * какие переменные у сервера есть, клиенту знать незачем.
 */
const requireEnv = async (c: Context<AppEnv>, next: Next): Promise<Response | void> => {
  const result: EnvResult = readEnv();
  if (result.ok) {
    c.set('env', result.env);
    return next();
  }
  log.error('окружение не разобрано', { variables: result.variables });
  const body: ErrorBody = { error: 'internal' };
  return c.json(body, 500);
};

/**
 * DATABASE_FAILURE_IS_REPORTED (docs/specs/51-db-migrations.md): `/api/health` отвечает
 * `200`, только если функция достаёт до базы и схема в ней применена. Ошибка базы
 * уходит в лог, наружу — только статус: текст ошибки Postgres раскрывает схему.
 *
 * Проверка одна на инстанс и помнит успех (`CachedDatabaseProbe`): частые запросы к
 * ручке не превращаются в частые запросы к базе. Создаётся на первом запросе — адрес
 * базы известен только после разбора окружения.
 */
const createHealthResponder = (deps: AppDeps): ((c: Context<AppEnv>) => Promise<Response>) => {
  let cached: DatabaseProbe | null = null;
  const resolveProbe = (env: Env): DatabaseProbe => {
    if (cached !== null) return cached;
    const source: DatabaseProbe = deps.createDatabaseProbe(env);
    cached = new CachedDatabaseProbe(source);
    return cached;
  };
  return async (c: Context<AppEnv>): Promise<Response> => {
    const env: Env = c.get('env');
    const probe: DatabaseProbe = resolveProbe(env);
    const check: DatabaseCheck = await probe.check();
    if (check.ok) {
      const body: HealthBody = { status: 'ok', version: BUILD_VERSION };
      return c.json(body);
    }
    log.error('база недоступна или схема не применена', { error: check.cause });
    const body: HealthBody = { status: 'database_unavailable', version: BUILD_VERSION };
    return c.json(body, 500);
  };
};

/**
 * Неизвестный путь под `/api` — JSON, а не HTML фронта: клиент API разбирает ответ
 * одинаково для любой ошибки.
 */
const respondNotFound = (c: Context<AppEnv>): Response => {
  log.debug('нет такой ручки', { method: c.req.method, path: c.req.path });
  const body: ErrorBody = { error: 'not_found' };
  return c.json(body, 404);
};

/**
 * Необработанное исключение. Лог пишется здесь, потому что здесь ошибка и
 * обработана (CLAUDE.md §9); наружу уходит только код, без стека и сообщения.
 */
const respondInternalError = (error: Error, c: Context<AppEnv>): Response => {
  log.error('ручка упала', { method: c.req.method, path: c.req.path, error });
  const body: ErrorBody = { error: 'internal' };
  return c.json(body, 500);
};

export const createApp = (deps: AppDeps): Hono<AppEnv> => {
  const app: Hono<AppEnv> = new Hono<AppEnv>().basePath('/api');
  const respondHealth: (c: Context<AppEnv>) => Promise<Response> = createHealthResponder(deps);

  app.use('*', requireEnv);
  app.get('/health', respondHealth);
  app.notFound(respondNotFound);
  app.onError(respondInternalError);

  return app;
};
