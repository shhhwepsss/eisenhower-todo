import type { ThemeKey } from '@/domain';

/** Порядок и подписи вариантов переключателя темы (docs/specs/35-design-system.md §4). */
export const THEME_KEYS: readonly ThemeKey[] = ['system', 'light', 'dark'];

export const THEME_LABELS: Record<ThemeKey, string> = {
  system: 'Системная',
  light: 'Светлая',
  dark: 'Тёмная',
};
