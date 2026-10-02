import type { Task } from './task';

/**
 * Соседи, между которыми встаёт задача (docs/specs/4-architecture.md §1).
 *
 * `null` с любой стороны — край квадранта; оба `null` — пустой квадрант.
 * UI передаёт соседей, а не строки рангов: RANK_IS_OPAQUE.
 */
export type Neighbours = { before: Task | null; after: Task | null };
