import type { Quadrant, Task } from '@/domain';

import { useStore } from '../context';
import { tasksInZone } from '../helpers';
import type { Store } from '../types';

/**
 * Выборки вкладки «Матрица» (docs/specs/4-architecture.md §5).
 *
 * Обе читают один и тот же массив задач — SINGLE_SOURCE_OF_TRUTH: зоны не хранят
 * копий, значит и разойтись им нечем. Завершённые не попадают ни в одну из них,
 * включая «Входящие», — DONE_LEAVES_MATRIX.
 */

/**
 * «Входящие» упорядочены по дате создания, новые сверху (PRD §3). Ранг здесь
 * не читается: порядок вычисляется и у задачи не хранится —
 * DERIVED_ORDER_IS_NOT_STORED.
 */
export const useInboxTasks = (): Task[] => {
  const { state }: Store = useStore();
  const inbox: Task[] = tasksInZone(state.tasks, 'inbox');
  return [...inbox].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
};

/** Порядок внутри квадранта — ручной, по рангу (ORDER_IS_PERSISTENT). */
export const useQuadrantTasks = (quadrant: Quadrant): Task[] => {
  const { state }: Store = useStore();
  return tasksInZone(state.tasks, quadrant);
};
