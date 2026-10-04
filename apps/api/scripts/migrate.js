import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

/**
 * `npm run db:migrate` (docs/specs/51-db-migrations.md). Сам прогон — в `src/migrate.ts`;
 * этот файл только загружает его через Vite, тем же `ssrLoadModule`, что и dev-сервер
 * (`vite.config.ts`): TypeScript исполняется без отдельного раннера в зависимостях, а
 * `apps/api/.env` подхватывается так же, как у `npm run dev:api`.
 *
 * FAILED_MIGRATION_FAILS_BUILD: любой сбой — ненулевой код выхода, и сборка Netlify,
 * в команде которой стоит этот скрипт, не публикует деплой.
 */
const root = fileURLToPath(new URL('..', import.meta.url));

const server = await createServer({
  root,
  // Сервер нужен только как загрузчик модулей: без порта, HMR и слежения за файлами.
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
});

try {
  const { runMigrations } = await server.ssrLoadModule('/src/migrate.ts');
  await runMigrations();
} catch (error) {
  // Полный текст ошибки базы в логе уместен: это лог сборки, а не ответ клиенту.
  console.error('db:migrate: миграции не применены', error);
  process.exitCode = 1;
} finally {
  await server.close();
}
