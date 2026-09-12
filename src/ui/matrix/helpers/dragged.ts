import type { Task } from '@/domain';
import type { MatrixZones } from '@/state';

/**
 * Задача, которую тянут, — по её идентификатору из `@dnd-kit`. Нужна копии
 * карточки в `DragOverlay`: оверлей рисуется у корня контекста, где самой
 * карточки уже нет, а есть только `active.id` (issue #38, DRAG_IS_VISIBLE).
 *
 * Ищется в тех же `MatrixZones`, по которым считается зона броска: матрица
 * показывает ровно их, и брать задачу из другого места значило бы рисовать
 * копию того, чего на экране нет (например, завершённой задачи).
 *
 * `null`, а не исключение: жест может закончиться в тот же кадр, в котором
 * задачу удалили из другой вкладки, и оверлею в этом случае просто нечего
 * показывать.
 */
export const findDraggedTask = (zones: MatrixZones, id: string | null): Task | null => {
  if (id === null) return null;
  const all: Task[] = Object.values(zones).flat();
  const found: Task | undefined = all.find((task) => task.id === id);
  return found ?? null;
};
