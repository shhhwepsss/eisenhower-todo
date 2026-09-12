import { useEffect } from 'react';
import { useTheme } from '@/state';
import type { Theme } from '@/state';

/**
 * Применяет выбранную тему к документу (docs/specs/35-design-system.md §4).
 *
 * Атрибут ставится на `<html>` (`document.documentElement`), а не на `body`:
 * на `body` живёт `data-dragging` (см. `useBodyDragging`), и смешивать два
 * независимых состояния на одном узле незачем.
 *
 * `'system'` не ставит атрибут вообще: тогда в `_theme.scss` решает медиазапрос
 * `prefers-color-scheme`, и смена системной настройки подхватывается без
 * перезагрузки — эффекту вмешиваться не нужно.
 */
export const useApplyTheme = (): void => {
  const { theme }: Theme = useTheme();

  useEffect(() => {
    const root: HTMLElement = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
      return;
    }
    root.setAttribute('data-theme', theme);
  }, [theme]);
};
