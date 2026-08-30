import type { Placement, Priority, Quadrant, Task } from './types';

type PriorityFlags = { urgent: boolean; important: boolean };

/**
 * Единственная таблица соответствия «квадрант ↔ пара признаков»
 * (docs/specs/4-architecture.md §2). Обратное направление — `quadrantOf`;
 * что две функции не разошлись, проверяет тест на круговой обход.
 */
const QUADRANT_FLAGS: Record<Quadrant, PriorityFlags> = {
  Q1: { urgent: true, important: true },
  Q2: { urgent: false, important: true },
  Q3: { urgent: true, important: false },
  Q4: { urgent: false, important: false },
};

function quadrantOf({ urgent, important }: PriorityFlags): Quadrant {
  if (important) return urgent ? 'Q1' : 'Q2';
  return urgent ? 'Q3' : 'Q4';
}

/**
 * Разбор задачи как значение. Неразобранная задача теряет признаки:
 * при `assigned === false` они нормализованы и читать их нельзя.
 */
export function priorityOf(task: Task): Priority {
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
export function placementOf(task: Task): Placement {
  return placementOfPriority(priorityOf(task));
}

export function placementOfPriority(priority: Priority): Placement {
  if (!priority.assigned) return { zone: 'inbox' };
  return { zone: 'quadrant', quadrant: quadrantOf(priority) };
}

export function priorityOfPlacement(placement: Placement): Priority {
  if (placement.zone === 'inbox') return { assigned: false };
  return { assigned: true, ...QUADRANT_FLAGS[placement.quadrant] };
}

export function samePlacement(a: Placement, b: Placement): boolean {
  if (a.zone === 'quadrant' && b.zone === 'quadrant') return a.quadrant === b.quadrant;
  return a.zone === b.zone;
}
