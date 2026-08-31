import type { Quadrant } from './quadrant';

/**
 * Где задача лежит в матрице (docs/specs/4-architecture.md §2): либо
 * во «Входящих», либо в одном из квадрантов. Ровно пять значений, третьего
 * состояния нет — на этом держится MATRIX_PARTITION.
 *
 * Плоская строка, а не объект: из неё собирается ключ перехода `${Zone}->${Zone}`
 * (`ZoneMoveKey`), по которому читается таблица `ZONE_MOVES`.
 */
export type Zone = 'inbox' | Quadrant;
