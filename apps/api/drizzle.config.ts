import { defineConfig } from 'drizzle-kit';

/**
 * Генерация миграций (docs/specs/51-db-migrations.md): `npm run db:generate` сравнивает
 * `src/db/schema.ts` с уже записанными миграциями и кладёт новую в `drizzle/`. К базе не
 * подключается — применяет миграции `npm run db:migrate`, а не drizzle-kit.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
