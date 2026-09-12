import type { ListSortKey } from '@/domain';

/** Четыре способа смотреть инвентарь (PRD §3, спека §8). */
export const SORT_LABELS: Record<ListSortKey, string> = {
  created: 'По дате создания',
  alphabet: 'По алфавиту',
  status: 'По статусу',
  quadrant: 'По квадранту',
};

export const SORT_KEYS: readonly ListSortKey[] = Object.keys(SORT_LABELS) as ListSortKey[];
