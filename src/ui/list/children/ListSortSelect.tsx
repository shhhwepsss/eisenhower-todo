import type { ListSortKey } from '@/domain';
import { useListSort } from '@/state';
import type { ListSort } from '@/state';
import { SORT_KEYS, SORT_LABELS } from '../constants';
import styles from './ListSortSelect.module.scss';

/**
 * Выбор сортировки списка (PRD S4a: «помню название, не помню, куда положил»).
 *
 * Сортировка применяется внутри групп, сами группы стоят на месте. Выбор ничего
 * не пишет в задачи — DERIVED_ORDER_IS_NOT_STORED.
 *
 * Приведение значения `select` к `ListSortKey` безопасно: варианты собраны
 * из той же таблицы `SORT_LABELS`, других значений в разметке нет.
 */
export const ListSortSelect = () => {
  const { listSort, selectListSort }: ListSort = useListSort();

  return (
    <label className={styles.control}>
      Сортировка
      <select
        className={styles.select}
        value={listSort}
        onChange={(event) => selectListSort(event.target.value as ListSortKey)}
      >
        {SORT_KEYS.map((key) => (
          <option key={key} value={key}>
            {SORT_LABELS[key]}
          </option>
        ))}
      </select>
    </label>
  );
};
