import type { AuthConfig } from '@hono/auth-js';
import { initAuthConfig } from '@hono/auth-js';
import { AuthError } from '@auth/core/errors';
import Google from '@auth/core/providers/google';
import type { Context, MiddlewareHandler } from 'hono';
import { AUTH_CLIENT_ERRORS } from '../constants/auth-client-errors.constant';
import { createLog } from '../logger';
import type { AppDeps, Env, Logger } from '../types';

const log: Logger = createLog('api/auth');

/**
 * Ошибка Auth.js — в общий лог. В запись идут только тип и текст: `cause` у ошибок
 * колбэка несёт ответ Google, а в нём бывают токены. Ошибки, которые вызвал клиент
 * (`AUTH_CLIENT_ERRORS`), — `warn`; остальные — `error`.
 */
const logAuthError = (error: Error): void => {
  if (!(error instanceof AuthError)) {
    log.error('Auth.js: исключение', { error });
    return;
  }
  if (AUTH_CLIENT_ERRORS.has(error.type)) {
    log.warn('Auth.js: запрос отклонён', { type: error.type });
    return;
  }
  log.error('Auth.js: ошибка', { type: error.type, message: error.message });
};

/**
 * Записи Auth.js — в общий лог (CLAUDE.md §9), а не в его собственный `console`.
 *
 * `debug` не передаётся намеренно: переданный `logger.debug` библиотека включает даже без
 * `config.debug` (`@auth/core/lib/utils/logger.js:40-47`), а в её отладочные записи уходят
 * секрет клиента Google, токены и cookie запроса. Без него отладка Auth.js выключена.
 */
const authLogger: AuthConfig['logger'] = {
  error: logAuthError,
  warn: (code: string): void => log.warn('Auth.js: предупреждение', { code }),
};

/**
 * Конфиг Auth.js на запрос (docs/specs/52-google-auth.md). Секрет и ключи Google
 * передаются явно, из разобранного окружения; `AUTH_URL` библиотека читает из
 * `process.env` сама, и `ENV_SCHEMA` проверил её раньше.
 *
 * `strategy: 'jwt'` — явно: с адаптером умолчание библиотеки — сессии в базе.
 * Адаптер создаётся на запрос и соединений не держит; при проверке сессии он не
 * вызывается (SESSION_CHECK_SKIPS_DATABASE).
 */
const buildAuthConfig = (env: Env, deps: AppDeps): AuthConfig => {
  const google: AuthConfig['providers'][number] = Google({
    clientId: env.AUTH_GOOGLE_ID,
    clientSecret: env.AUTH_GOOGLE_SECRET,
  });
  return {
    secret: env.AUTH_SECRET,
    providers: [google],
    adapter: deps.createAuthAdapter(env),
    session: { strategy: 'jwt' },
    logger: authLogger,
  };
};

/**
 * Кладёт конфиг Auth.js в контекст запроса: из него читают и ручки `/api/auth/*`, и
 * `requireSession`. Окружение к этому моменту разобрано (`requireEnv`).
 */
export const createAuthConfigMiddleware = (deps: AppDeps): MiddlewareHandler => {
  return initAuthConfig((context: Context): AuthConfig => {
    const env: Env = context.get('env');
    return buildAuthConfig(env, deps);
  });
};
