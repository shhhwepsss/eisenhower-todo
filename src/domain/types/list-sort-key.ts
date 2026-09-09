/**
 * Чем отсортирован список задач (docs/specs/4-architecture.md §2).
 *
 * Это выбор пользователя, а не свойство задачи: в снапшот задач он не попадает
 * и рангов не трогает — DERIVED_ORDER_IS_NOT_STORED.
 */
export type ListSortKey = 'created' | 'alphabet' | 'status' | 'quadrant';
