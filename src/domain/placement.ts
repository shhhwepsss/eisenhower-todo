import { QUADRANT_FLAGS } from './constants';
import type { Placement, Priority, PriorityFlags, Quadrant, Task } from './types';

/**
 * Обратная сторона `QUADRANT_FLAGS`. Таблица и эта функция описывают одно
 * соответствие с двух сторон — что они не разошлись, проверяет тест
 * на круговой обход в tests/domain/placement.test.ts.
 */
function resolveQuadrantPlacement({ urgent, important }: PriorityFlags): Quadrant {
  if (important) return urgent ? 'Q1' : 'Q2';
  return urgent ? 'Q3' : 'Q4';
}

/**
 * Разбор задачи как значение. Неразобранная задача теряет признаки:
 * при `assigned === false` они нормализованы и читать их нельзя.
 */
export function resolvePriority(task: Task): Priority {
  if (!task.assigned) return { assigned: false };
  return { assigned: true, urgent: task.urgent, important: task.important };
}

/**
 * Место задачи в матрице. Единственная функция, отвечающая на этот вопрос —
 * MATRIX_PARTITION, QUADRANT_IS_DERIVED (docs/specs/4-architecture.md §2).
 *
 * Задача без признаков попадает во «Входящие», а не в Q4: Q4 — это результат
 * разбора, а неразобранность — его отсутствие.
 */
export function resolvePlacement(task: Task): Placement {
  return resolvePlacementByPriority(resolvePriority(task));
}

export function resolvePlacementByPriority(priority: Priority): Placement {
  if (!priority.assigned) return { zone: 'inbox' };
  return { zone: 'quadrant', quadrant: resolveQuadrantPlacement(priority) };
}

export function resolvePriorityByPlacement(placement: Placement): Priority {
  if (placement.zone === 'inbox') return { assigned: false };
  return { assigned: true, ...QUADRANT_FLAGS[placement.quadrant] };
}

export function isSamePlacement(a: Placement, b: Placement): boolean {
  if (a.zone === 'quadrant' && b.zone === 'quadrant') return a.quadrant === b.quadrant;
  return a.zone === b.zone;
}
