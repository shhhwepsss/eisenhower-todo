import type { z } from 'zod';
import { ENV_SCHEMA } from '../constants/env-schema.constant';
import type { Env, EnvResult, EnvSource } from '../types';

/** Имя переменной, на которой споткнулась проверка: первый элемент пути ошибки. */
const variableOf = (issue: z.core.$ZodIssue): string => String(issue.path[0]);

/**
 * Разбор окружения по `ENV_SCHEMA` (ENV_FAILS_FAST). Чистая функция от источника,
 * а не от `process.env`: тест передаёт объект, а не подменяет окружение процесса.
 */
export const parseEnv = (source: EnvSource): EnvResult => {
  const parsed: z.ZodSafeParseResult<Env> = ENV_SCHEMA.safeParse(source);
  if (parsed.success) return { ok: true, env: parsed.data };
  const named: string[] = parsed.error.issues.map(variableOf);
  const variables: string[] = [...new Set(named)];
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
