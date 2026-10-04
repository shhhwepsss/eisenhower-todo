import { fileURLToPath } from 'node:url';
import { NeonSchemaMigrator } from './db/neon/neon-schema-migrator';
import { readEnv } from './lib/env.lib';
import { createLog } from './logger';
import type { EnvResult, Logger, SchemaMigrator } from './types';

/**
 * Прогон миграций — тело команды `npm run db:migrate` (docs/specs/51-db-migrations.md).
 * На проде её запускает сборка Netlify после `npm run build`, локально — человек.
 *
 * Сбой — исключение. Его ловит запускающий скрипт (`scripts/migrate.js`): он пишет лог
 * и выставляет код выхода (FAILED_MIGRATION_FAILS_BUILD). Здесь сбой не логируется:
 * лог пишет тот, кто ошибку обработал (CLAUDE.md §9).
 */
const log: Logger = createLog('api/migrate');

export const runMigrations = async (): Promise<void> => {
  const result: EnvResult = readEnv();
  if (!result.ok) {
    const variables: string = result.variables.join(', ');
    throw new Error(`окружение не разобрано: ${variables}`);
  }
  const folderUrl: URL = new URL('../drizzle', import.meta.url);
  const migrationsFolder: string = fileURLToPath(folderUrl);
  const migrator: SchemaMigrator = new NeonSchemaMigrator(result.env.DATABASE_URL, migrationsFolder);
  await migrator.migrate();
  log.info('схема базы актуальна', { migrationsFolder });
};
