import { getTasksListGroup, isTaskLive } from '@/domain';
import type { ListGroup, Task } from '@/domain';

import { useStore } from '../context';
import { sortForList } from '../helpers';
import type { Store } from '../types';

/**
 * Выборка одной группы вкладки «Список» (docs/specs/4-architecture.md §5).
 *
 * Единственный фильтр — надгробие: список показывает всё остальное без исключения,
 * LIST_IS_COMPLETE. Группу задачи выводит домен одной функцией, поэтому три группы
 * дают разбиение и ни одна задача не теряется — LIST_PARTITION.
 *
 * Порядок внутри группы задаёт выбранная сортировка, порядок самих групп фиксирован
 * и живёт в разметке вкладки, а не здесь.
 */
export const useListGroup = (group: ListGroup): Task[] => {
  const { state }: Store = useStore();
  const live: Task[] = state.tasks.filter(isTaskLive);
  const inGroup: Task[] = live.filter((task) => getTasksListGroup(task) === group);
  return sortForList(inGroup, state.ui.listSort);
};
