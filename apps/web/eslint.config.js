import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { baseConfig } from '../../eslint.config.base.js';

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

const DND_IS_UI_ONLY =
  'DND_IS_UI_ONLY (docs/specs/4-architecture.md §7): перетаскивание — деталь интерфейса. ' +
  'Домен, стор и хранилище про @dnd-kit не знают: наружу оно отдаёт соседей, а не жест.';

const SLICE_PUBLIC_API =
  'SLICE_PUBLIC_API: чужой слайс импортируется через его index.ts по алиасу @/, ' +
  'например "@/ui/list". Внутренности (App.tsx, tabs.tsx, lib/, types.ts) — приватные.';

export default tseslint.config(
  ...baseConfig,

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
    files: ['src/state/**/*.{ts,tsx}', 'src/storage/**/*.ts', 'src/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@dnd-kit', '@dnd-kit/**'], message: DND_IS_UI_ONLY }] },
      ],
    },
  },
);
