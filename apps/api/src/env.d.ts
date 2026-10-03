/// <reference types="vite/client" />

/** Версия сборки — подставляется Vite при сборке и в dev (`vite.config.ts`, `define`). */
declare const __BUILD_VERSION__: string;

/** Хеш последней миграции из `drizzle/` на момент сборки — подставляет Vite (`vite.config.ts`, `define`). */
declare const __LATEST_MIGRATION_HASH__: string | null;
