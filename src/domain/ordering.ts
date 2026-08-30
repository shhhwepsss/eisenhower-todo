import { generateKeyBetween } from 'fractional-indexing';

import type { Neighbours, Task } from './types';

/**
 * Ранг между соседями (docs/specs/4-architecture.md §1). Единственное место,
 * где ранг вообще создаётся, — RANK_IS_QUADRANT_LOCAL: соседи всегда берутся
 * из квадранта-приёмника.
 *
 * Оба соседа `null` — пустой квадрант; один `null` — край.
 */
export function rankBetween({ before, after }: Neighbours): string {
  return generateKeyBetween(before?.rank ?? null, after?.rank ?? null);
}

/**
 * Порядок внутри квадранта — RANK_TOTAL_ORDER (docs/specs/4-architecture.md §1).
 * Ранги могут совпасть после независимых вставок, поэтому ключ сортировки —
 * пара `(rank, id)`: `id` уникален глобально, значит порядок определён всегда.
 */
export function compareTasks(a: Task, b: Task): number {
  if (a.rank !== b.rank) return a.rank < b.rank ? -1 : 1;
  if (a.id !== b.id) return a.id < b.id ? -1 : 1;
  return 0;
}

export function sortByRank(tasks: readonly Task[]): Task[] {
  return [...tasks].sort(compareTasks);
}

/**
 * Задача уже стоит между этими соседями. Нужно, чтобы бросок на собственное
 * место не перегенерировал ранг (идемпотентность, §1).
 */
export function isBetween(task: Task, { before, after }: Neighbours): boolean {
  const afterBefore = before === null || compareTasks(before, task) < 0;
  const beforeAfter = after === null || compareTasks(task, after) < 0;
  return afterBefore && beforeAfter;
}

/**
 * Конец квадранта — куда задача встаёт без явного жеста: назначение
 * переключателями и возврат из done (PRD §3 «Куда встаёт задача»).
 */
export function endOf(tasks: readonly Task[]): Neighbours {
  return { before: sortByRank(tasks).at(-1) ?? null, after: null };
}
