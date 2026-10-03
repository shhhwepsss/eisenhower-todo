import { fileURLToPath } from 'node:url';
import { NeonSchemaMigrator } from './db/neon/neon-schema-migrator';
import { readEnv } from './lib/env.lib';
import { createLog } from './logger';
import type { EnvResult, Logger, SchemaMigrator } from './types';

/**
 * Прогон миграций — тело команды `npm run db:migrate` (docs/specs/51-db-migrations.md).
 * На проде её запускает сборка Netlify после `npm run build`, локально — человек.
 *
 * Возвращает, прошёл ли прогон; код выхода выставляет запускающий скрипт
 * (`scripts/migrate.js`, FAILED_MIGRATION_FAILS_BUILD). Лог пишется здесь: ошибка здесь
 * и обработана (CLAUDE.md §9). Полный текст ошибки базы в логе уместен — это лог
 * сборки, а не ответ клиенту.
 */
const log: Logger = createLog('api/migrate');

export const runMigrations = async (): Promise<boolean> => {
  const result: EnvResult = readEnv();
  if (!result.ok) {
    log.error('окружение не разобрано', { variables: result.variables });
    return false;
  }
  const folderUrl: URL = new URL('../drizzle', import.meta.url);
  const migrationsFolder: string = fileURLToPath(folderUrl);
  const migrator: SchemaMigrator = new NeonSchemaMigrator(result.env.DATABASE_URL, migrationsFolder);
  try {
    await migrator.migrate();
  } catch (error) {
    log.error('миграции не применены', { error });
    return false;
  }
  log.info('схема базы актуальна', { migrationsFolder });
  return true;
};
