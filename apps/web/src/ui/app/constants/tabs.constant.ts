import type { TabId, TabItem } from '../types';

export const TABS: readonly TabItem[] = [
  { id: 'list', label: 'Список' },
  { id: 'matrix', label: 'Матрица' },
];

export const DEFAULT_TAB: TabId = 'list';
