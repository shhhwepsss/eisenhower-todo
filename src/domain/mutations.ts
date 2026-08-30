import { isBetween, rankBetween } from './ordering';
import { placementOf, placementOfPriority, priorityOfPlacement, samePlacement } from './placement';
import { normalizeText } from './text';
import type { Neighbours, Placement, Priority, Task, TaskStatus } from './types';

/**
 * Мутации задачи — чистые функции «задача + намерение + время → задача».
 *
 * Два правила общие для всех:
 *
 * - TIMESTAMPS_MONOTONIC_PER_TASK — любое изменение проходит здесь и ставит `updatedAt`;
 *   «тихих» правок задачи вне домена не существует.
 * - Идемпотентность (docs/specs/4-architecture.md §10) — мутация, которой нечего менять,
 *   возвращает ту же задачу. Поэтому повтор действия не двигает `updatedAt`
 *   и не выглядит для будущей синхронизации как правка.
 */

export function editText(task: Task, raw: string, now: string): Task {
  const text = normalizeText(raw);
  if (text === task.text) return task;
  return { ...task, text, updatedAt: now };
}

/**
 * Признаки разбора `setStatus` не трогает — PRIORITY_SURVIVES_DONE: задача
 * возвращается из done в тот же квадрант.
 *
 * Ранг же перегенерируется при возврате из done: по PRD §3 задача встаёт в конец
 * своего прежнего квадранта, а не туда, где стояла до завершения. Соседи для этого
 * приходят в `between` и в остальных переходах не нужны.
 */
export function setStatus(
  task: Task,
  status: TaskStatus,
  between: Neighbours,
  now: string,
): Task {
  if (task.status === status) return task;
  const returnsToMatrix = task.status === 'done' && task.assigned;
  const rank = returnsToMatrix ? rankBetween(between) : task.rank;
  return { ...task, status, rank, updatedAt: now };
}

/** Разбор переключателями: задача встаёт в конец зоны-приёмника (PRD §3). */
export function setPriority(
  task: Task,
  priority: Priority,
  between: Neighbours,
  now: string,
): Task {
  return placeTask(task, priority, between, now);
}

/** Перетаскивание: задача встаёт ровно между переданными соседями (PRD §3). */
export function moveToZone(
  task: Task,
  to: Placement,
  between: Neighbours,
  now: string,
): Task {
  return placeTask(task, priorityOfPlacement(to), between, now);
}

/** DELETE_IS_A_TOMBSTONE: запись остаётся, повторное удаление — no-op. */
export function deleteTask(task: Task, now: string): Task {
  if (task.deletedAt !== null) return task;
  return { ...task, deletedAt: now, updatedAt: now };
}

/**
 * Общее тело `setPriority` и `moveToZone`: обе меняют ровно одно — где задача
 * лежит. Разница только в том, чем зона названа снаружи.
 *
 * Ранг генерируется только для квадранта: во «Входящих» порядок задаёт `createdAt`,
 * и ранг там смысла не имеет (RANK_IS_QUADRANT_LOCAL).
 */
function placeTask(task: Task, priority: Priority, between: Neighbours, now: string): Task {
  const to = placementOfPriority(priority);
  const staysPut =
    samePlacement(placementOf(task), to) && (to.zone === 'inbox' || isBetween(task, between));
  if (staysPut) return task;

  return {
    ...task,
    assigned: priority.assigned,
    urgent: priority.assigned && priority.urgent,
    important: priority.assigned && priority.important,
    rank: to.zone === 'quadrant' ? rankBetween(between) : task.rank,
    updatedAt: now,
  };
}
