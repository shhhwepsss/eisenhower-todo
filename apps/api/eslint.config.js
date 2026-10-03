import globals from 'globals';
import tseslint from 'typescript-eslint';
import { baseConfig } from '../../eslint.config.base.js';

const DB_BEHIND_INTERFACE =
  'DB_BEHIND_INTERFACE (docs/specs/51-db-migrations.md): Drizzle и драйвер Neon ' +
  'импортируются только в src/db/. Остальной код зависит от интерфейсов из types/ — ' +
  'реализацию базы можно заменить, не трогая приложение.';

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
    // запрещены.
    files: ['**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },

  {
    // Базовое `no-restricted-imports`, а не `@typescript-eslint/…`: второе занято
    // границами пакетов в базе, и объект с тем же правилом стёр бы их настройки
    // (eslint.config.base.js). Это имя в apps/api теперь тоже занято: следующий запрет
    // импорта дописывается в этот объект, а не заводится вторым.
    //
    // Только код приложения: тесты смотрят в базу напрямую, своим соединением.
    files: ['src/**/*.ts', 'functions/**/*.ts'],
    ignores: ['src/db/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'drizzle-orm',
                'drizzle-orm/*',
                '@neondatabase/serverless',
                '@neondatabase/serverless/*',
              ],
              message: DB_BEHIND_INTERFACE,
            },
          ],
        },
      ],
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
