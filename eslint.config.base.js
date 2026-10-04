import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { fileLayoutPlugin } from './eslint.file-layout.js';

/**
 * Общая часть ESLint для всех пакетов монорепозитория. Пакет импортирует её в свой
 * eslint.config.js и добавляет правила своих слоёв (docs/specs/48-monorepo.md).
 */
const ARROW_FUNCTIONS_ONLY =
  'ARROW_FUNCTIONS_ONLY (CLAUDE.md §8): функции объявляются стрелочными выражениями. ' +
  'Одна форма на весь проект — читателю не приходится держать в голове разницу ' +
  'между объявлением и выражением, а `this` и хойстинг не зависят от способа записи.';

const PACKAGE_BOUNDARIES =
  'PACKAGE_BOUNDARIES (docs/specs/48-monorepo.md): общий код достаётся только через ' +
  '@eisenhower/core. Приложения не импортируют друг друга, в чужой пакет не ходят ' +
  'относительным путём.';

const NO_EMPTY_CATCH =
  'NO_EMPTY_CATCH: пустой `catch` глотает ошибку. Ошибку либо обрабатывают, либо ' +
  'пропускают наверх; блок из одного комментария — тоже пустой.';

/**
 * Встроенное `no-empty` считает блок с комментарием непустым, поэтому запрет записан
 * селектором. Экспортируется: пакет, который задаёт `no-restricted-syntax` сам,
 * заменяет настройки базы целиком и обязан перечислить этот запрет заново.
 */
export const noEmptyCatch = {
  selector: 'CatchClause > BlockStatement[body.length=0]',
  message: NO_EMPTY_CATCH,
};

/**
 * Границы пакетов держит `@typescript-eslint/no-restricted-imports`, а не базовое
 * `no-restricted-imports`. Во flat config поздний объект с тем же правилом заменяет
 * его настройки целиком: границы слоёв пакета, объявленные базовым правилом, молча
 * стёрли бы границы пакетов. Два разных правила друг друга не перекрывают.
 *
 * Правило написано для любого пакета: apps/api (#50) попадает под него, просто
 * подключив базу.
 */
const packageBoundaries = {
  files: ['**/*.{ts,tsx}'],
  rules: {
    '@typescript-eslint/no-restricted-imports': [
      'error',
      {
        patterns: [
          { group: ['@eisenhower/*', '!@eisenhower/core'], message: PACKAGE_BOUNDARIES },
          { group: ['**/apps/**', '**/packages/**'], message: PACKAGE_BOUNDARIES },
        ],
      },
    ],
  },
};

/**
 * Раскладка файлов (docs/specs/58-file-layout.md). Входит в baseConfig: новый пакет
 * получает правило сам, а не когда о нём вспомнили.
 *
 * Только src/: тест держит фикстуры и локальные типы рядом с проверкой, а *.d.ts —
 * объявления окружения, а не типы предметной области.
 */
const fileLayout = {
  files: ['src/**/*.{ts,tsx}'],
  ignores: ['**/*.d.ts'],
  plugins: { 'file-layout': fileLayoutPlugin },
  rules: {
    'file-layout/file-in-its-folder': 'error',
    'file-layout/types-live-in-type-files': 'error',
    'file-layout/type-files-hold-only-types': 'error',
    'file-layout/constants-live-in-constant-files': 'error',
  },
};

export const baseConfig = tseslint.config(
  { ignores: ['dist/**', 'coverage/**'] },

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'prefer-arrow-callback': ['error', { allowNamedFunctions: false }],
      '@typescript-eslint/typedef': [
        'error',
        { variableDeclaration: true, variableDeclarationIgnoreFunction: true },
      ],
      'no-restricted-syntax': [
        'error',
        { selector: 'FunctionExpression', message: ARROW_FUNCTIONS_ONLY },
        noEmptyCatch,
      ],
    },
  },

  packageBoundaries,

  fileLayout,

  {
    files: ['tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },

  {
    files: ['*.config.{js,ts}'],
    languageOptions: {
      globals: globals.node,
    },
  },
);
