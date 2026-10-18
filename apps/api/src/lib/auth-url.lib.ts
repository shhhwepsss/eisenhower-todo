import { AUTH_BASE_PATH } from '../constants/api-paths.constant';

/**
 * Путь `AUTH_URL` — `/api/auth`, где ручки Auth.js и зарегистрированы. Строка, которая
 * не разбирается как URL, — `false`, а не исключение: zod 4 зовёт проверку и после
 * ошибки формата, и исключение унесло бы в лог значение переменной вместо её имени
 * (ENV_FAILS_FAST).
 */
export const hasAuthBasePath = (authUrl: string): boolean => {
  if (!URL.canParse(authUrl)) return false;
  const url: URL = new URL(authUrl);
  return url.pathname === AUTH_BASE_PATH;
};
