import type { Quadrant } from './quadrant';

/**
 * Плоское имя зоны матрицы. `Placement` описывает место структурно и не даёт
 * представить невозможное состояние; `Zone` — то же самое одной строкой,
 * чтобы переходы можно было выписать таблицей (см. ZONE_MOVES).
 */
export type Zone = 'inbox' | Quadrant;
