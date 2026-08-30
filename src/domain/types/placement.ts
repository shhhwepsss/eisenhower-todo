import type { Quadrant } from './quadrant';

/**
 * Место задачи в матрице (docs/specs/4-architecture.md §2).
 *
 * Размеченное объединение, а не пара флагов: вернуть сразу две зоны невозможно
 * по типу — на этом держится MATRIX_PARTITION.
 */
export type Placement = { zone: 'inbox' } | { zone: 'quadrant'; quadrant: Quadrant };
