import type { Task } from '@/domain';
import type { MatrixZones } from '@/state';

/**
 * Задача матрицы по её идентификатору. Спрашивают двое, и обоим известен только
 * идентификатор: копия карточки в `DragOverlay` знает `active.id` (issue #38,
 * DRAG_IS_VISIBLE), а окно правки — ту задачу, по которой кликнули (issue #40).
 *
 * Ищется в тех же `MatrixZones`, которые матрица показывает, а не в общем
 * списке задач: брать задачу из другого места значило бы открыть или нарисовать
 * то, чего на экране нет — например, завершённую задачу.
 *
 * `null`, а не исключение: задачу могли удалить в тот же кадр — жест тогда
 * рисует пустоту, а окно закрывается само.
 */
export const findTaskInZones = (zones: MatrixZones, id: string | null): Task | null => {
  if (id === null) return null;
  const all: Task[] = Object.values(zones).flat();
  const found: Task | undefined = all.find((task) => task.id === id);
  return found ?? null;
};
