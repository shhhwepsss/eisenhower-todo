import { pgTable, text } from 'drizzle-orm/pg-core';

/**
 * Схема базы (docs/specs/51-db-migrations.md). Из неё `npm run db:generate` получает
 * миграции в `apps/api/drizzle/`.
 *
 * `app_meta` — служебная таблица «ключ — значение». Таблиц предметной области ещё нет
 * (#52, #46); эта даёт конвейеру первую миграцию. Код её не читает: `/api/health`
 * сверяет журнал миграций, а не таблицы.
 */
export const appMeta = pgTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
