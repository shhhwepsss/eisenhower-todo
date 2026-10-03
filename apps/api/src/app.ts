import type { Hono } from 'hono';
import { createApp } from './create-app';
import { NeonDatabaseProbe } from './db/neon-database-probe';
import type { AppEnv, DatabaseProbe, Env } from './types';

/**
 * Приложение API с настоящими зависимостями. Одно на функцию Netlify и на dev-сервер:
 * обработчик функции и dev-сервер только передают сюда `Request`.
 *
 * Единственное место вне `src/db/`, где приложение встречается с реализацией базы.
 * Migrator сюда не импортируется: в функцию он не попадает
 * (MIGRATIONS_STAY_OUT_OF_FUNCTION, docs/specs/51-db-migrations.md).
 */
const createDatabaseProbe = (env: Env): DatabaseProbe => new NeonDatabaseProbe(env.DATABASE_URL);

export const app: Hono<AppEnv> = createApp({ createDatabaseProbe });
