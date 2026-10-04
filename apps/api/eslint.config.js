import globals from 'globals';
import tseslint from 'typescript-eslint';
import { baseConfig, noEmptyCatch } from '../../eslint.config.base.js';
import { moduleBoundariesPlugin } from './eslint.module-boundaries.js';

const DB_BEHIND_INTERFACE =
  'DB_BEHIND_INTERFACE (docs/specs/51-db-migrations.md): Drizzle и драйвер Neon ' +
  'импортируются только в src/db/. Остальной код зависит от интерфейсов из types/ — ' +
  'реализацию базы можно заменить, не трогая приложение.';

const HTTP_STAYS_AT_EDGE =
  'HTTP_STAYS_AT_EDGE (docs/specs/60-api-modules.md): Hono импортируется только на ' +
  'HTTP-краю — в сборке приложения, src/http/ и в *.controller.ts / *.routes.ts модуля. ' +
  'Use-case, сервисы и слой базы о запросе и ответе не знают.';

const DB_PACKAGES = {
  group: ['drizzle-orm', 'drizzle-orm/*', '@neondatabase/serverless', '@neondatabase/serverless/*'],
  message: DB_BEHIND_INTERFACE,
};

const HTTP_PACKAGES = {
  group: ['hono', 'hono/*'],
  message: HTTP_STAYS_AT_EDGE,
};

const HTTP_EDGE_FILES = [
  'src/app.ts',
  'src/create-app.ts',
  'src/http/**/*.ts',
  'src/modules/*/*.controller.ts',
  'src/modules/*/*.routes.ts',
];

/**
 * API живёт в Node (docs/specs/50-api-skeleton.md). Общие правила и границы пакетов —
 * из базы; здесь только то, чем API отличается.
 */
export default tseslint.config(
  ...baseConfig,

  {
    files: ['**/*.ts', 'scripts/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    // Сущности API — классы с методами (CLAUDE.md §8). Метод класса в ESTree — это
    // FunctionExpression, поэтому запрет из базы здесь снят. Объявления `function`
    // (`func-style`) и не-стрелочные колбэки (`prefer-arrow-callback`) по-прежнему
    // запрещены. Запрет пустого `catch` остаётся — и для скриптов на JS тоже.
    files: ['**/*.ts', 'scripts/**/*.js'],
    rules: {
      'no-restricted-syntax': ['error', noEmptyCatch],
    },
  },

  {
    // Базовое `no-restricted-imports`, а не `@typescript-eslint/…`: второе занято
    // границами пакетов в базе, и объект с тем же правилом стёр бы их настройки
    // (eslint.config.base.js). Это имя в apps/api теперь тоже занято: запрет импорта
    // дописывается в один из трёх объектов ниже, а не заводится ещё одним. Объекты
    // перекрываются по файлам, и поздний заменяет настройки раннего целиком — поэтому
    // каждый перечисляет все свои запреты сам.
    //
    // Только код приложения: тесты смотрят в базу напрямую, своим соединением.
    files: ['src/**/*.ts', 'functions/**/*.ts'],
    ignores: ['src/db/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [DB_PACKAGES, HTTP_PACKAGES] }],
    },
  },

  {
    // HTTP-край (HTTP_STAYS_AT_EDGE): Hono здесь разрешён, база — по-прежнему нет.
    files: HTTP_EDGE_FILES,
    rules: {
      'no-restricted-imports': ['error', { patterns: [DB_PACKAGES] }],
    },
  },

  {
    // Слой базы: Drizzle и Neon здесь разрешены, Hono — нет.
    files: ['src/db/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [HTTP_PACKAGES] }],
    },
  },

  {
    // MODULE_HAS_ONE_ENTRY (docs/specs/60-api-modules.md). Своё правило, а не ещё один
    // шаблон `no-restricted-imports`: см. eslint.module-boundaries.js.
    files: ['src/**/*.ts', 'functions/**/*.ts'],
    plugins: { 'module-boundaries': moduleBoundariesPlugin },
    rules: {
      'module-boundaries/module-has-one-entry': 'error',
    },
  },

  {
    // Схема Drizzle — декларация: тип таблицы выводится из её описания, и по нему
    // Drizzle типизирует запросы. Аннотация повторила бы описание целиком.
    files: ['src/db/schema.ts'],
    rules: {
      '@typescript-eslint/typedef': 'off',
    },
  },
);
