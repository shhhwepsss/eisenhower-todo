import type { Context, Next } from 'hono';
import { readEnv } from '../lib/env.lib';
import { createLog } from '../logger';
import type { AppEnv, EnvResult, ErrorBody, Logger } from '../types';

const log: Logger = createLog('api/app');

/**
 * ENV_FAILS_FAST (docs/specs/51-db-migrations.md): ни одна ручка не выполняется с
 * неразобранным окружением. В лог уходят имена переменных, наружу — общий `internal`:
 * какие переменные у сервера есть, клиенту знать незачем.
 */
export const requireEnv = async (context: Context<AppEnv>, next: Next): Promise<Response | void> => {
  const result: EnvResult = readEnv();
  if (result.ok) {
    context.set('env', result.env);
    return next();
  }
  log.error('окружение не разобрано', { variables: result.variables });
  const body: ErrorBody = { error: 'internal' };
  return context.json(body, 500);
};
