import type { z } from 'zod';
import { ENV_SCHEMA, MIGRATION_ENV_SCHEMA } from '../constants/env-schema.constant';
import type { Env, EnvResult, EnvSource, MigrationEnv, MigrationEnvResult } from '../types';

/** Имя переменной, на которой споткнулась проверка: первый элемент пути ошибки. */
const variableOf = (issue: z.core.$ZodIssue): string => String(issue.path[0]);

/** Имена переменных, не прошедших проверку, без повторов и без значений. */
const namesOf = (error: z.ZodError): string[] => {
  const named: string[] = error.issues.map(variableOf);
  return [...new Set(named)];
};

/**
 * Разбор окружения по `ENV_SCHEMA` (ENV_FAILS_FAST). Чистая функция от источника,
 * а не от `process.env`: тест передаёт объект, а не подменяет окружение процесса.
 */
export const parseEnv = (source: EnvSource): EnvResult => {
  const parsed: z.ZodSafeParseResult<Env> = ENV_SCHEMA.safeParse(source);
  if (parsed.success) return { ok: true, env: parsed.data };
  const variables: string[] = namesOf(parsed.error);
  return { ok: false, variables };
};

/**
 * Разбор окружения прогона миграций по `MIGRATION_ENV_SCHEMA`: скрипту `db:migrate` нужна
 * только база, секреты входа сборке и CI не нужны. Не запоминается — скрипт читает
 * окружение один раз.
 */
export const parseMigrationEnv = (source: EnvSource): MigrationEnvResult => {
  const parsed: z.ZodSafeParseResult<MigrationEnv> = MIGRATION_ENV_SCHEMA.safeParse(source);
  if (parsed.success) return { ok: true, env: parsed.data };
  const variables: string[] = namesOf(parsed.error);
  return { ok: false, variables };
};

/**
 * Разобранное окружение инстанса запоминается только при успехе: окружение функции
 * не меняется за её жизнь, а неудачный разбор повторяется — и снова пишет лог на
 * каждый запрос, пока окружение не починят.
 */
let cachedEnv: Env | null = null;

export const readEnv = (): EnvResult => {
  if (cachedEnv !== null) return { ok: true, env: cachedEnv };
  const result: EnvResult = parseEnv(process.env);
  if (result.ok) cachedEnv = result.env;
  return result;
};

/** Сброс запомненного окружения — только для тестов, которые меняют `process.env`. */
export const forgetEnv = (): void => {
  cachedEnv = null;
};
