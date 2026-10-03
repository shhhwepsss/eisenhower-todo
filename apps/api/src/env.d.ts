/// <reference types="vite/client" />

/** Версия сборки — подставляется Vite при сборке и в dev (`vite.config.ts`, `define`). */
declare const __BUILD_VERSION__: string;

/** Хеши миграций из `drizzle/` на момент сборки — подставляет Vite (`vite.config.ts`, `define`). */
declare const __MIGRATION_HASHES__: readonly string[];
