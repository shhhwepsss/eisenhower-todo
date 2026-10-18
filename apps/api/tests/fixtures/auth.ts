import { encode } from '@auth/core/jwt';
import type { AuthAdapter, SessionUser } from '../../src/types';

/**
 * Окружение входа и сессия для тестов (docs/specs/52-google-auth.md). Валидная сессия
 * собирается без Google: cookie шифруется `encode` тем же `AUTH_SECRET`, как это делает
 * Auth.js после колбэка.
 */
export const AUTH_SECRET: string = 'test-secret-that-is-at-least-32-characters-long';

export const OTHER_SECRET: string = 'another-secret-that-is-at-least-32-characters';

export const AUTH_ENV: Record<string, string> = {
  AUTH_SECRET,
  AUTH_URL: 'http://localhost/api/auth',
  AUTH_GOOGLE_ID: 'test-client.apps.googleusercontent.com',
  AUTH_GOOGLE_SECRET: 'test-client-secret',
};

/** Переменные входа — в `process.env`, где их читают и `ENV_SCHEMA`, и Auth.js. */
export const stubAuthEnv = (): void => {
  for (const [name, value] of Object.entries(AUTH_ENV)) vi.stubEnv(name, value);
};

/** Имя cookie сессии по `http`; по `https` у него префикс `__Secure-`. */
export const SESSION_COOKIE: string = 'authjs.session-token';

export const SECURE_SESSION_COOKIE: string = '__Secure-authjs.session-token';

export const SESSION_USER: SessionUser = {
  id: '5f0c6c0e-8f8e-4f3a-9a77-0d7f4a3b9c11',
  name: 'Анна Смирнова',
  email: 'anna@example.com',
};

export type SessionOptions = { secret?: string; maxAge?: number; cookieName?: string };

/** Заголовок `Cookie` с JWT сессии; соль шифрования — имя cookie, как у Auth.js. */
export const sessionCookieOf = async (options: SessionOptions = {}): Promise<string> => {
  const cookieName: string = options.cookieName ?? SESSION_COOKIE;
  const token: string = await encode({
    token: {
      sub: SESSION_USER.id,
      name: SESSION_USER.name,
      email: SESSION_USER.email,
      picture: 'https://lh3.googleusercontent.com/a/photo',
    },
    secret: options.secret ?? AUTH_SECRET,
    salt: cookieName,
    ...(options.maxAge === undefined ? {} : { maxAge: options.maxAge }),
  });
  return `${cookieName}=${token}`;
};

export type UnreachableAdapter = { adapter: AuthAdapter; calls: string[] };

const rejectAs = (name: string, calls: string[]): (() => Promise<never>) => {
  return async (): Promise<never> => {
    calls.push(name);
    throw new Error('база недоступна');
  };
};

/**
 * Адаптер недоступной базы: каждый метод падает и записывает своё имя. По `calls` тест
 * видит, ходила ли проверка сессии в базу (SESSION_CHECK_SKIPS_DATABASE).
 */
export const createUnreachableAdapter = (): UnreachableAdapter => {
  const calls: string[] = [];
  const adapter: AuthAdapter = {
    createUser: rejectAs('createUser', calls),
    getUser: rejectAs('getUser', calls),
    getUserByEmail: rejectAs('getUserByEmail', calls),
    getUserByAccount: rejectAs('getUserByAccount', calls),
    updateUser: rejectAs('updateUser', calls),
    linkAccount: rejectAs('linkAccount', calls),
  };
  return { adapter, calls };
};
