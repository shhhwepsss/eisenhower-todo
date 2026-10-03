import type { Task } from '@eisenhower/core';

import { useStore } from '../context';
import { tasksInZone } from '../lib';
import type { Store } from '../types';

import { sortInboxByFreshness } from './use-matrix-tasks';
import type { MatrixZones } from '../types';

/**
 * Вся матрица одной выборкой. Нужна там, где решение принимается не по одной
 * зоне: перетаскивание считает соседей в зоне-приёмнике, а зона-приёмник
 * известна только в момент броска.
 *
 * Зоны выписаны по одной, а не собраны циклом: `Record<Zone, Task[]>` требует
 * ровно эти пять ключей, поэтому забытую зону поймает компилятор. Собирается
 * всё из тех же `tasksInZone`, что и зональные хуки, — расходиться нечему.
 */
export const useMatrixZones = (): MatrixZones => {
  const { state }: Store = useStore();
  const tasks: Task[] = state.tasks;

  return {
    inbox: sortInboxByFreshness(tasksInZone(tasks, 'inbox')),
    Q1: tasksInZone(tasks, 'Q1'),
    Q2: tasksInZone(tasks, 'Q2'),
    Q3: tasksInZone(tasks, 'Q3'),
    Q4: tasksInZone(tasks, 'Q4'),
  };
};
