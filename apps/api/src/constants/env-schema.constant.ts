import { z } from 'zod';
import { hasAuthBasePath } from '../lib/auth-url.lib';

/**
 * Окружение прогона миграций (`npm run db:migrate`). Сборке Netlify и CI секреты входа
 * не нужны — им нужна только база.
 */
export const MIGRATION_ENV_SCHEMA: z.ZodObject<{ DATABASE_URL: z.ZodURL }> = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

/**
 * Окружение API (ENV_FAILS_FAST, docs/specs/51-db-migrations.md). Каждая переменная,
 * которую читает код, описана здесь: обращение к `process.env` в обход схемы — это
 * `undefined` в глубине кода вместо ошибки с именем переменной на старте.
 *
 * `DATABASE_URL` — строка подключения Neon. Протокол проверяется, чтобы перепутанная
 * переменная (адрес сайта вместо базы) падала здесь, а не при первом запросе к базе.
 *
 * Переменные входа — docs/specs/52-google-auth.md, «Окружение». `AUTH_URL` библиотека
 * читает из `process.env` сама; здесь проверяется, что она задана и что её путь —
 * `/api/auth`, где ручки Auth.js и зарегистрированы. Остальные переменные, которые
 * Auth.js понимает сам (`AUTH_SECRET_1..3`, `AUTH_TRUST_HOST`, `AUTH_REDIRECT_PROXY_URL`,
 * `AUTH_GOOGLE_ISSUER`), не используются и здесь не описаны.
 */
export const ENV_SCHEMA: z.ZodObject<{
  DATABASE_URL: z.ZodURL;
  AUTH_SECRET: z.ZodString;
  AUTH_URL: z.ZodURL;
  AUTH_GOOGLE_ID: z.ZodString;
  AUTH_GOOGLE_SECRET: z.ZodString;
}> = MIGRATION_ENV_SCHEMA.extend({
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.url({ protocol: /^https?$/ }).refine(hasAuthBasePath),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
});
