import { QUADRANT_FLAGS } from './constants';
import type { Priority, PriorityFlags, Quadrant, Task, Zone } from './types';

/**
 * Обратная сторона `QUADRANT_FLAGS`. Таблица и эта функция описывают одно
 * соответствие с двух сторон — что они не разошлись, проверяет тест
 * на круговой обход в tests/domain/zone.test.ts.
 */
const resolveQuadrantByFlags = ({ urgent, important }: PriorityFlags): Quadrant => {
  if (important) return urgent ? 'Q1' : 'Q2';
  return urgent ? 'Q3' : 'Q4';
};

/**
 * Разбор задачи как значение. Неразобранная задача теряет признаки:
 * при `assigned === false` они нормализованы и читать их нельзя.
 */
export const resolvePriority = (task: Task): Priority => {
  if (!task.assigned) return { assigned: false };
  return { assigned: true, urgent: task.urgent, important: task.important };
};

/**
 * Зона задачи в матрице. Единственная функция, отвечающая на этот вопрос —
 * MATRIX_PARTITION, QUADRANT_IS_DERIVED (docs/specs/4-architecture.md §2).
 *
 * Задача без признаков попадает во «Входящие», а не в Q4: Q4 — это результат
 * разбора, а неразобранность — его отсутствие.
 */
export const resolveZone = (task: Task): Zone => {
  const priority: Priority = resolvePriority(task);
  return resolveZoneByPriority(priority);
};

export const resolveZoneByPriority = (priority: Priority): Zone => {
  if (!priority.assigned) return 'inbox';
  return resolveQuadrantByFlags(priority);
};

export const resolvePriorityByZone = (zone: Zone): Priority => {
  if (zone === 'inbox') return { assigned: false };
  return { assigned: true, ...QUADRANT_FLAGS[zone] };
};
