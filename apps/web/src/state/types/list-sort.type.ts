import type { ListSortKey } from '@eisenhower/core';

/** Выбранная сортировка списка и способ её сменить (спека §8). */
export type ListSort = {
  listSort: ListSortKey;
  selectListSort: (key: ListSortKey) => void;
};
