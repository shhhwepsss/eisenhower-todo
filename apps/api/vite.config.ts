import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { getRequestListener } from '@hono/node-server';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import type { MigrationMeta } from 'drizzle-orm/migrator';
import { loadEnv } from 'vite';
import type { Plugin, ViteDevServer } from 'vite';
import { defineConfig } from 'vitest/config';

type Fetch = (request: Request) => Response | Promise<Response>;

type NodeListener = (incoming: IncomingMessage, outgoing: ServerResponse) => Promise<void>;

/**
 * Версия сборки для `/api/health`. На Netlify — коммит деплоя (`COMMIT_REF` есть в
 * окружении сборки), локально — `dev`.
 */
const BUILD_VERSION: string = process.env.COMMIT_REF ?? 'dev';

/**
 * Хеши миграций из `drizzle/` (docs/specs/51-db-migrations.md, SCHEMA_MATCHES_CODE).
 * Читает их тот же `readMigrationFiles`, что и migrator drizzle, — хеш в сборке и хеш в
 * журнале базы считаются одним кодом. В функцию едут только хеши: по ним `/api/health`
 * сверяет код с журналом, а сами файлы миграций остаются в репозитории.
 *
 * Читаются при старте Vite: после `npm run db:generate` dev-сервер нужно перезапустить.
 */
const readMigrationHashes = (): string[] => {
  const folderUrl: URL = new URL('./drizzle', import.meta.url);
  const migrationsFolder: string = fileURLToPath(folderUrl);
  const migrations: MigrationMeta[] = readMigrationFiles({ migrationsFolder });
  return migrations.map((migration) => migration.hash);
};

const MIGRATION_HASHES: string[] = readMigrationHashes();

/**
 * Dev-сервер API (docs/specs/50-api-skeleton.md, «Разработка»). Каждый запрос
 * загружает `src/app.ts` через Vite — исходники вместе с `@eisenhower/core` читаются
 * как есть, правка видна на следующем запросе без пересборки. `getRequestListener`
 * переводит запрос `node:http` в `Request`, как это делает платформа на проде.
 */
const serveApi = (): Plugin => {
  return {
    name: 'eisenhower:serve-api',
    configureServer: (server: ViteDevServer) => {
      const fetchFromSource: Fetch = async (request: Request) => {
        const module: Record<string, unknown> = await server.ssrLoadModule('/src/app.ts');
        const app: { fetch: Fetch } = module.app as { fetch: Fetch };
        return app.fetch(request);
      };
      const listener: NodeListener = getRequestListener(fetchFromSource);
      server.middlewares.use(listener);
    },
  };
};

/**
 * Окружение dev-сервера из `apps/api/.env` (docs/specs/51-db-migrations.md). Vite отдаёт
 * коду только `VITE_*` и только через `import.meta.env`, а API читает `process.env` —
 * как на проде, где переменные кладёт туда Netlify. Заданное в процессе не
 * перезаписывается: переменная из командной строки сильнее файла.
 *
 * В тестах не применяется: тест сам задаёт окружение, и `.env` разработчика не должен
 * подменять ему «переменная не задана».
 */
const loadDotEnv = (): Plugin => {
  return {
    name: 'eisenhower:load-dot-env',
    apply: 'serve',
    configureServer: (server: ViteDevServer) => {
      if (server.config.mode === 'test') return;
      const fileEnv: Record<string, string> = loadEnv(server.config.mode, server.config.root, '');
      for (const [name, value] of Object.entries(fileEnv)) {
        process.env[name] ??= value;
      }
    },
  };
};

export default defineConfig({
  plugins: [loadDotEnv(), serveApi()],
  appType: 'custom',
  define: {
    __BUILD_VERSION__: JSON.stringify(BUILD_VERSION),
    __MIGRATION_HASHES__: JSON.stringify(MIGRATION_HASHES),
  },
  server: {
    // Явный IPv4 — по той же причине, что в apps/web/vite.config.ts.
    host: '127.0.0.1',
    // Порт, на который проксирует apps/web/vite.config.ts.
    port: 8787,
    strictPort: true,
    // ONE_ORIGIN: на проде CORS-заголовков нет — dev-сервер их тоже не добавляет.
    cors: false,
  },
  build: {
    // FUNCTION_IS_SELF_CONTAINED: функция собирается в один файл. Бандлер функций
    // Netlify оставляет внешними все пакеты, а `@eisenhower/core` — исходники на
    // TypeScript, которые Node не исполнит; поэтому core вклеивается здесь.
    ssr: 'functions/api.ts',
    outDir: 'dist/functions',
    target: 'node22',
    rollupOptions: {
      output: { entryFileNames: 'api.mjs' },
    },
  },
  ssr: {
    // Связанный workspace-пакет Vite и так вклеивает. Явно — чтобы сборка не зависела
    // от того, как core попал в node_modules (симлинк workspace или копия).
    noExternal: ['@eisenhower/core'],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
