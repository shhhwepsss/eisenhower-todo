import type { ThemeKey } from '@eisenhower/core';

import { useStore } from '../context';
import type { Store } from '../types';
import type { Theme } from '../types';

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
