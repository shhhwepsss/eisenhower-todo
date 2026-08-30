import type { PriorityFlags, Quadrant } from '../types';

/**
 * Единственная таблица соответствия «квадрант → пара признаков»
 * (docs/specs/4-architecture.md §2). Обратное направление — `quadrantOf`
 * в placement.ts; что две стороны не разошлись, проверяет тест на круговой обход.
 */
export const QUADRANT_FLAGS: Record<Quadrant, PriorityFlags> = {
  Q1: { urgent: true, important: true },
  Q2: { urgent: false, important: true },
  Q3: { urgent: true, important: false },
  Q4: { urgent: false, important: false },
};

export const QUADRANTS: readonly Quadrant[] = ['Q1', 'Q2', 'Q3', 'Q4'];
