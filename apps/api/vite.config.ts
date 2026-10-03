import type { IncomingMessage, ServerResponse } from 'node:http';
import { getRequestListener } from '@hono/node-server';
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

export default defineConfig({
  plugins: [serveApi()],
  appType: 'custom',
  define: {
    __BUILD_VERSION__: JSON.stringify(BUILD_VERSION),
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
