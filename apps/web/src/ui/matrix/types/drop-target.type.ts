import type { Neighbours, Zone } from '@eisenhower/core';

/**
 * Куда попадёт брошенная задача (PRD S2, S4). Функция чистая и ничего не знает
 * ни про `@dnd-kit`, ни про DOM: на входе — состояние матрицы и два
 * идентификатора, на выходе — зона и соседи.
 *
 * Отдаются именно соседи, а не ранг: ранг непрозрачен для интерфейса
 * (RANK_IS_OPAQUE), а генерирует его домен по соседям зоны-приёмника
 * (RANK_IS_QUADRANT_LOCAL).
 */
export type DropTarget = { zone: Zone; between: Neighbours };
