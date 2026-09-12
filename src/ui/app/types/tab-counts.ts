import type { TabId } from './tab-id';

/** Сколько задач показывает каждая вкладка — счётчик в пункте меню. */
export type TabCounts = Record<TabId, number>;
