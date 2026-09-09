import type { ListSortKey } from '@/domain';

import { useStore } from '../context';
import type { Store } from '../types';

/** Выбранная сортировка списка и способ её сменить (спека §8). */
export type ListSort = {
  listSort: ListSortKey;
  selectListSort: (key: ListSortKey) => void;
};

/**
 * Сортировка — настройка интерфейса, а не свойство задачи: она переживает
 * перезагрузку (спека §8), но не трогает ни `rank`, ни `updatedAt` —
 * DERIVED_ORDER_IS_NOT_STORED.
 */
export const useListSort = (): ListSort => {
  const { state, dispatch }: Store = useStore();

  const selectListSort = (key: ListSortKey): void => {
    dispatch({ type: 'list-sort/selected', key });
  };

  return { listSort: state.ui.listSort, selectListSort };
};
