import { endOf, isTaskInMatrix, resolveZone, sortByRank } from '@/domain';
import type { Neighbours, Task, Zone } from '@/domain';

/**
 * Задачи одной зоны матрицы в порядке рангов.
 *
 * `isTaskInMatrix` отсекает удалённые и завершённые — DONE_LEAVES_MATRIX. Значит
 * и соседи для нового ранга берутся только среди видимых: место в квадранте
 * считается по тому, что пользователь на экране видит.
 */
export const tasksInZone = (tasks: readonly Task[], zone: Zone): Task[] => {
  const visible: Task[] = tasks.filter(isTaskInMatrix);
  const inZone: Task[] = visible.filter((task) => resolveZone(task) === zone);
  return sortByRank(inZone);
};

/**
 * Соседи для постановки в конец зоны — куда задача попадает без явного жеста:
 * разбор переключателями и возврат из `done` (PRD §3 «Куда встаёт задача»).
 */
export const endOfZone = (tasks: readonly Task[], zone: Zone): Neighbours => {
  const inZone: Task[] = tasksInZone(tasks, zone);
  return endOf(inZone);
};
