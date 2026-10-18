import type { z } from 'zod';
import type { MIGRATION_ENV_SCHEMA } from '../constants/env-schema.constant';

/** Разобранное окружение прогона миграций: только то, что нужно, чтобы дойти до базы. */
export type MigrationEnv = z.infer<typeof MIGRATION_ENV_SCHEMA>;
