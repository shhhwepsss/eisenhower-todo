import type { PriorityFlags, Quadrant } from '../types';

/**
 * Единственная таблица соответствия «квадрант → пара признаков»
 * (docs/specs/4-architecture.md §2). Обратное направление —
 * `resolveQuadrantPlacement` в placement.ts; что две стороны не разошлись,
 * проверяет тест на круговой обход.
 */
export const QUADRANT_FLAGS: Record<Quadrant, PriorityFlags> = {
  Q1: { urgent: true, important: true },
  Q2: { urgent: false, important: true },
  Q3: { urgent: true, important: false },
  Q4: { urgent: false, important: false },
};

/**
 * Список квадрантов выводится из таблицы, а не пишется вторым литералом:
 * два списка разошлись бы молча. Тип ключей `QUADRANT_FLAGS` — `Quadrant`,
 * и запись `Record` требует их все, поэтому приведение здесь безопасно.
 */
export const QUADRANTS = Object.keys(QUADRANT_FLAGS) as readonly Quadrant[];
