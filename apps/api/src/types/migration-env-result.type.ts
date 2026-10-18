import type { MigrationEnv } from './migration-env.type';

/** Итог разбора окружения миграций; устроен как `EnvResult`. */
export type MigrationEnvResult = { ok: true; env: MigrationEnv } | { ok: false; variables: string[] };
