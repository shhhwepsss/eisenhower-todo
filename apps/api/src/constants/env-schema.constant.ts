import { z } from 'zod';

/**
 * Окружение API (ENV_FAILS_FAST, docs/specs/51-db-migrations.md). Каждая переменная,
 * которую читает код, описана здесь: обращение к `process.env` в обход схемы — это
 * `undefined` в глубине кода вместо ошибки с именем переменной на старте.
 *
 * `DATABASE_URL` — строка подключения Neon. Протокол проверяется, чтобы перепутанная
 * переменная (адрес сайта вместо базы) падала здесь, а не при первом запросе к базе.
 */
export const ENV_SCHEMA: z.ZodObject<{ DATABASE_URL: z.ZodURL }> = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});
