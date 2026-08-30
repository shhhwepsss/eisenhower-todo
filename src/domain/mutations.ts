import { ZONE_MOVES } from './constants';
import { isBetween, rankBetween } from './ordering';
import { resolvePlacement, resolvePlacementByPriority, resolvePriorityByPlacement, isSamePlacement } from './placement';
import { normalizeTaskText, normalizeTaskTitle } from './text';
import { resolveZoneByPlacement } from './zone';
import type { Neighbours, Placement, Priority, Task, TaskStatus } from './types';

/**
 * Мутации задачи — чистые функции «задача + намерение + время → задача».
 *
 * Время приходит параметром, а не читается здесь: REDUCER_IS_PURE
 * (docs/specs/4-architecture.md §5). Тот же вход даёт тот же выход, поэтому
 * тесты обходятся без фейковых таймеров.
 *
 * Два правила общие для всех:
 *
 * - TIMESTAMPS_MONOTONIC_PER_TASK — изменение задачи собирается только в `touch`,
 *   и это единственное место, где `updatedAt` двигается. Первое значение ставит
 *   `createTask` (src/domain/factory.ts) при рождении задачи, дальше поле трогает
 *   только `touch`. Забыть его нельзя, можно лишь пройти мимо двери — и это ловит
 *   tests/domain/mutations.test.ts, который перебирает экспорты этого модуля
 *   по таблице и падает на не покрытом экспорте.
 * - Идемпотентность (спека §10) — мутация, которой нечего менять, возвращает ту же
 *   задачу. Поэтому повтор действия не двигает `updatedAt` и не выглядит для
 *   будущей синхронизации как правка.
 */

/** Всё, что мутация вправе менять. `id`, `createdAt` и `updatedAt` сюда не входят. */
type TaskPatch = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>;

/** Единственное место, где мутация двигает `updatedAt` (первое значение ставит `createTask`). */
const touch = (task: Task, patch: TaskPatch, now: string): Task => ({
  ...task,
  ...patch,
  updatedAt: now,
});

export const editTitle = (task: Task, raw: string, now: string): Task => {
  const title = normalizeTaskTitle(raw);
  if (title === task.title) return task;
  return touch(task, { title }, now);
};

export const editText = (task: Task, raw: string, now: string): Task => {
  const text = normalizeTaskText(raw);
  if (text === task.text) return task;
  return touch(task, { text }, now);
};

/**
 * Признаки разбора `setStatus` не трогает — PRIORITY_SURVIVES_DONE: задача
 * возвращается из done в тот же квадрант.
 *
 * Ранг же перегенерируется при возврате из done: по PRD §3 задача встаёт в конец
 * своего прежнего квадранта, а не туда, где стояла до завершения. Соседи для этого
 * приходят в `between` и в остальных переходах не нужны.
 */
export const setStatus = (
  task: Task,
  status: TaskStatus,
  between: Neighbours,
  now: string,
): Task => {
  if (task.status === status) return task;
  const returnsToMatrix = task.status === 'done' && task.assigned;
  const rank = returnsToMatrix ? rankBetween(between) : task.rank;
  return touch(task, { status, rank }, now);
};

/** Разбор переключателями: задача встаёт в конец зоны-приёмника (PRD §3). */
export const setPriority = (
  task: Task,
  priority: Priority,
  between: Neighbours,
  now: string,
): Task => {
  const to = resolvePlacementByPriority(priority);
  return placeTask(task, to, between, now);
};

/** Перетаскивание: задача встаёт ровно между переданными соседями (PRD §3). */
export const moveToZone = (
  task: Task,
  to: Placement,
  between: Neighbours,
  now: string,
): Task => placeTask(task, to, between, now);

/** DELETE_IS_A_TOMBSTONE: запись остаётся, повторное удаление — no-op. */
export const deleteTask = (task: Task, now: string): Task => {
  if (task.deletedAt !== null) return task;
  return touch(task, { deletedAt: now }, now);
};

/**
 * Общее тело `setPriority` и `moveToZone`: обе меняют ровно одно — в какой зоне
 * лежит задача. Разница только в том, чем зона названа снаружи.
 *
 * Что происходит при каждом переходе, решает не эта функция, а таблица
 * `ZONE_MOVES` (src/domain/constants/zone-moves.ts): все 25 переходов выписаны
 * там построчно, и правило ранга читается оттуда, а не выводится здесь по месту.
 *
 * Тело читается сверху вниз по шагам, каждый шаг назван: где задача лежит сейчас,
 * куда её кладут, что таблица говорит про этот переход, надо ли вообще что-то делать,
 * какими становятся признаки и ранг.
 */
const placeTask = (task: Task, to: Placement, between: Neighbours, now: string): Task => {
  const from = resolvePlacement(task);
  const fromZone = resolveZoneByPlacement(from);
  const toZone = resolveZoneByPlacement(to);
  const move = ZONE_MOVES[`${fromZone}->${toZone}`];

  const staysPut = isSamePlacement(from, to)
    && (move.rank === 'keep' || isBetween(task, between));
  if (staysPut) return task;

  const priority = resolvePriorityByPlacement(to);
  const assigned = priority.assigned;
  const urgent = assigned && priority.urgent;
  const important = assigned && priority.important;
  const rank = move.rank === 'regenerate' ? rankBetween(between) : task.rank;

  return touch(task, { assigned, urgent, important, rank }, now);
};
