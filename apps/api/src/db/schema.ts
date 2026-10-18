import type { AdapterAccountType } from '@auth/core/adapters';
import { integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Схема базы (docs/specs/51-db-migrations.md). Из неё `npm run db:generate` получает
 * миграции в `apps/api/drizzle/`. Что значит каждая таблица — `docs/entities/`.
 *
 * `app_meta` — служебная таблица «ключ — значение»: она дала конвейеру первую миграцию.
 * Код её не читает: `/api/health` сверяет журнал миграций, а не таблицы.
 */
export const appMeta = pgTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

/**
 * Пользователь (docs/specs/52-google-auth.md, docs/entities/user.md). Ключи свойств и
 * типы первых пяти колонок — контракт адаптера Auth.js: переименовать свойство нельзя,
 * имя колонки в базе — можно. `created_at` — наша, её ставит база.
 */
export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
});

/**
 * Аккаунт у провайдера входа (docs/entities/account.md). Набор свойств целиком задаёт
 * адаптер Auth.js — отсюда `snake_case` в ключах токенов рядом с `camelCase` остальных.
 */
export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })],
);
