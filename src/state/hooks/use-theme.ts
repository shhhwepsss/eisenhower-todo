import type { ThemeKey } from '@/domain';

import { useStore } from '../context';
import type { Store } from '../types';

/** Выбранная тема интерфейса и способ её сменить (docs/specs/35-design-system.md §4). */
export type Theme = {
  theme: ThemeKey;
  selectTheme: (theme: ThemeKey) => void;
};

/**
 * Тема — настройка интерфейса, тем же путём, что и `listSort`: переживает
 * перезагрузку, отдельного хранилища под неё не заводится.
 */
export const useTheme = (): Theme => {
  const { state, dispatch }: Store = useStore();

  const selectTheme = (theme: ThemeKey): void => {
    dispatch({ type: 'theme/selected', theme });
  };

  return { theme: state.ui.theme, selectTheme };
};
