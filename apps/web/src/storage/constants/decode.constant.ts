import type { ListSortKey, TaskStatus, ThemeKey } from '@eisenhower/core';

/**
 * Множества значений заданы `Record`ом от типа, а не списком: список пришлось бы
 * держать в согласии с объединением вручную, а `Record` требует все ключи —
 * новый статус без строки здесь не соберётся.
 */
export const TASK_STATUSES: Record<TaskStatus, true> = { todo: true, in_progress: true, done: true };

export const LIST_SORT_KEYS: Record<ListSortKey, true> = {
  created: true,
  alphabet: true,
  status: true,
  quadrant: true,
};

export const THEME_KEYS: Record<ThemeKey, true> = { system: true, light: true, dark: true };
