import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

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
      ],
    },
  },

  packageBoundaries,

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
