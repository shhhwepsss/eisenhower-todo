/**
 * Разбор задачи по признакам (docs/specs/4-architecture.md §2).
 *
 * Пара `(urgent, important)` осмыслена только у разобранной задачи: у неразобранной
 * её просто нет, поэтому она и не представлена в типе.
 */
export type Priority =
  | { assigned: false }
  | { assigned: true; urgent: boolean; important: boolean };
