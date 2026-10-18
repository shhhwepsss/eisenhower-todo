import type { AuthAdapter } from './auth-adapter.type';
import type { DatabaseProbe } from './database-probe.type';
import type { Env } from './env.type';

/**
 * Что приложению дают снаружи. Фабрики, а не готовые объекты: адрес базы известен
 * только после разбора окружения, а он происходит на запросе (ENV_FAILS_FAST).
 */
export type AppDeps = {
  createDatabaseProbe: (env: Env) => DatabaseProbe;
  createAuthAdapter: (env: Env) => AuthAdapter;
};
