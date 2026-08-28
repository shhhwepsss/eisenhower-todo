import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Границы слоёв (docs/specs/4-architecture.md §4, §5) держатся линтером, а не ревью.
 * Правила работают по строке импорта и не резолвят модуль, поэтому настроены до того,
 * как за границами появятся storage/ и state/.
 */
const STORAGE_IS_ISOLATED =
  'STORAGE_IS_ISOLATED (docs/specs/4-architecture.md §4): ui/ не знает о хранилище. ' +
  'Работайте через хуки из state/.';

const STATE_ACCESS_VIA_HOOKS =
  'STATE_ACCESS_VIA_HOOKS (docs/specs/4-architecture.md §5): ui/ импортирует из state/ ' +
  'только точку входа с хуками, но не reducer/actions/store/selectors.';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**'] },

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  {
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/storage', '**/storage/**'], message: STORAGE_IS_ISOLATED },
            { group: ['**/state/*', '**/state/**'], message: STATE_ACCESS_VIA_HOOKS },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: STORAGE_IS_ISOLATED },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'localStorage', message: STORAGE_IS_ISOLATED },
        { object: 'globalThis', property: 'localStorage', message: STORAGE_IS_ISOLATED },
      ],
    },
  },

  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.ts'],
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
