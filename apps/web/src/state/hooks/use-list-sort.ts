import type { ListSortKey } from '@eisenhower/core';

import { useStore } from '../context';
import type { Store } from '../types';
import type { ListSort } from '../types';

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
