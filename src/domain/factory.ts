import { rankBetween } from './ordering';
import { normalizeText } from './text';
import type { NewTask, Task } from './types';

/**
 * Единственная дверь в `Task` (docs/specs/4-architecture.md §2).
 *
 * Задача рождается неразобранной — MANUAL_PRIORITISATION: приложение не угадывает
 * приоритет за пользователя. Ранг проставляется начальный: во «Входящих» порядок
 * задаёт `createdAt`, а в квадранте ранг всё равно будет сгенерирован заново
 * относительно соседей приёмника (RANK_IS_QUADRANT_LOCAL).
 */
export function createTask({ id, text, now }: NewTask): Task {
  return {
    id,
    text: normalizeText(text),
    assigned: false,
    urgent: false,
    important: false,
    status: 'todo',
    rank: rankBetween({ before: null, after: null }),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}
