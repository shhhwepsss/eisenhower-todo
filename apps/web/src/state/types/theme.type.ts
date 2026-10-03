import type { ThemeKey } from '@eisenhower/core';

/** Выбранная тема интерфейса и способ её сменить (docs/specs/35-design-system.md §4). */
export type Theme = {
  theme: ThemeKey;
  selectTheme: (theme: ThemeKey) => void;
};
