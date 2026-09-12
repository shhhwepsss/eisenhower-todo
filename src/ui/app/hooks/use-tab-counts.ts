import type { ListGroup, Task } from '@/domain';
import { useListGroup, useMatrixZones } from '@/state';
import type { MatrixZones } from '@/state';
import type { TabCounts } from '../types';

/**
 * Счётчики вкладок для меню (docs/specs/35-design-system.md, часть 2,
 * допущения): у «Списка» — все живые задачи, у «Матрицы» — те, что в матрице
 * видны (выполненные туда не попадают, DONE_LEAVES_MATRIX).
 *
 * Считается по тем же выборкам, которыми вкладки и рисуются, — второго способа
 * посчитать задачи не заводится, иначе счётчик в меню однажды разойдётся с тем,
 * что человек видит на экране. Стор при этом не меняется (DOMAIN_UNTOUCHED):
 * нужные срезы хуки уже отдают.
 *
 * Группы и зоны собраны в `Record`, а не сложены по одной: забытую группу
 * ловит компилятор, а не глаз на ревью.
 */
const totalOf = (lists: Task[][]): number => {
  return lists.reduce((total, tasks) => total + tasks.length, 0);
};

export const useTabCounts = (): TabCounts => {
  const inbox: Task[] = useListGroup('inbox');
  const assigned: Task[] = useListGroup('assigned');
  const done: Task[] = useListGroup('done');
  const zones: MatrixZones = useMatrixZones();

  const groups: Record<ListGroup, Task[]> = { inbox, assigned, done };
  const groupLists: Task[][] = Object.values(groups);
  const zoneLists: Task[][] = Object.values(zones);

  return { list: totalOf(groupLists), matrix: totalOf(zoneLists) };
};
