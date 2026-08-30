import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Границы слоёв (docs/specs/4-architecture.md §4, §5) держатся линтером, а не ревью.
 * Правила работают по строке импорта и не резолвят модуль, поэтому настроены до того,
 * как за границами появятся storage/ и state/.
 *
 * Правила применяются к src/ui/** — продовому коду. tests/ под них не подпадают:
 * тест на то и тест, чтобы дотянуться до внутренностей проверяемого модуля.
 */
const STORAGE_IS_ISOLATED =
  'STORAGE_IS_ISOLATED (docs/specs/4-architecture.md §4): ui/ не знает о хранилище. ' +
  'Работайте через хуки из state/.';

const STATE_ACCESS_VIA_HOOKS =
  'STATE_ACCESS_VIA_HOOKS (docs/specs/4-architecture.md §5): ui/ импортирует из state/ ' +
  'только точку входа с хуками, но не reducer/actions/store/selectors.';

const ARROW_FUNCTIONS_ONLY =
  'ARROW_FUNCTIONS_ONLY (CLAUDE.md §8): функции объявляются стрелочными выражениями. ' +
  'Одна форма на весь проект — читателю не приходится держать в голове разницу ' +
  'между объявлением и выражением, а `this` и хойстинг не зависят от способа записи.';

const SLICE_PUBLIC_API =
  'SLICE_PUBLIC_API: чужой слайс импортируется через его index.ts по алиасу @/, ' +
  'например "@/ui/list". Внутренности (App.tsx, tabs.tsx, lib/, types.ts) — приватные.';

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
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'prefer-arrow-callback': ['error', { allowNamedFunctions: false }],
      'no-restricted-syntax': [
        'error',
        { selector: 'FunctionExpression', message: ARROW_FUNCTIONS_ONLY },
      ],
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
            { group: ['../../**', '@/ui/*/*', '@/ui/*/**'], message: SLICE_PUBLIC_API },
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
