import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { drizzle } from 'drizzle-orm/neon-http';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { AuthAdapter } from '../../types';
import { accounts, users } from '../schema';
import { configureNeonFor } from './neon-stand';

/**
 * Адаптер Auth.js поверх HTTP-драйвера Neon (docs/specs/52-google-auth.md): через него
 * вход находит пользователя по аккаунту Google и создаёт его при первом входе.
 *
 * Переданы только `users` и `accounts`: сессия — JWT в cookie, входа по письму и
 * WebAuthn нет, поэтому остальных таблиц адаптера в схеме нет. Транзакций адаптер не
 * открывает — HTTP-драйвера ему достаточно.
 *
 * Соединения нет: каждый запрос — отдельный HTTP-вызов, объект ничего не держит.
 */
export const createNeonAuthAdapter = (databaseUrl: string): AuthAdapter => {
  configureNeonFor(databaseUrl);
  const db: NeonHttpDatabase = drizzle(databaseUrl);
  return DrizzleAdapter(db, { usersTable: users, accountsTable: accounts });
};
