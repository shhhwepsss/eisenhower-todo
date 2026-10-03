import type { TabId } from './tab-id.type';

/** Сколько задач показывает каждая вкладка — счётчик в пункте меню. */
export type TabCounts = Record<TabId, number>;
