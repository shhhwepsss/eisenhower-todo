import tseslint from 'typescript-eslint';
import { baseConfig } from '../../eslint.config.base.js';

/**
 * Ядро — домен без зависимостей (docs/specs/4-architecture.md §4). Его функции будут
 * работать и на сервере (#46), поэтому браузер и React сюда не попадают.
 */
const CORE_IS_PORTABLE =
  'CORE_IS_PORTABLE (docs/specs/48-monorepo.md): @eisenhower/core не зависит от браузера ' +
  'и от React — его функции работают и на сервере.';

const DND_IS_UI_ONLY =
  'DND_IS_UI_ONLY (docs/specs/4-architecture.md §7): перетаскивание — деталь интерфейса. ' +
  'Домен, стор и хранилище про @dnd-kit не знают: наружу оно отдаёт соседей, а не жест.';

const BROWSER_GLOBALS = ['window', 'document', 'navigator', 'localStorage', 'sessionStorage'];

export default tseslint.config(
  ...baseConfig,

  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react/**', 'react-dom', 'react-dom/**'], message: CORE_IS_PORTABLE },
            { group: ['@dnd-kit', '@dnd-kit/**'], message: DND_IS_UI_ONLY },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...BROWSER_GLOBALS.map((name) => ({ name, message: CORE_IS_PORTABLE })),
      ],
    },
  },
);
