import { pgTable, text } from 'drizzle-orm/pg-core';

/**
 * Схема базы (docs/specs/51-db-migrations.md). Из неё `npm run db:generate` получает
 * миграции в `apps/api/drizzle/`.
 *
 * `app_meta` — служебная таблица «ключ — значение». Таблиц предметной области ещё нет
 * (#52, #46); эта проводит конвейер целиком: её создаёт первая миграция, а читает
 * проверка базы в `/api/health`.
 */
export const appMeta = pgTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
