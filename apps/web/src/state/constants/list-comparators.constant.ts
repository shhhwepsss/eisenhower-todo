import { resolveZone } from '@eisenhower/core';
import type { ListSortKey, Task } from '@eisenhower/core';
import { byCreatedDesc, byRank, byTitle, zoneOrder } from '../lib/list-comparators.lib';
import { STATUS_ORDER } from './status-order.constant';

/** Сравнение задач для каждого ключа сортировки списка (PRD §3 «Порядок задач»). */
export const COMPARATORS: Record<ListSortKey, (a: Task, b: Task) => number> = {
  created: byCreatedDesc,
  alphabet: byTitle,
  status: byRank((task) => STATUS_ORDER[task.status]),
  quadrant: byRank((task) => zoneOrder(resolveZone(task))),
};
