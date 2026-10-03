import globals from 'globals';
import tseslint from 'typescript-eslint';
import { baseConfig } from '../../eslint.config.base.js';

/**
 * API живёт в Node (docs/specs/50-api-skeleton.md). Общие правила и границы пакетов —
 * из базы; здесь только то, чем API отличается.
 */
export default tseslint.config(
  ...baseConfig,

  {
    files: ['**/*.ts'],
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
);
