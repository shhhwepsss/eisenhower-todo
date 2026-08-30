import { rankBetween } from './ordering';
import { normalizeTaskText, normalizeTaskTitle } from './text';
import type { NewTask, Task } from './types';

/**
 * Единственная дверь в `Task` (docs/specs/4-architecture.md §2).
 *
 * Задача рождается неразобранной — MANUAL_PRIORITISATION: приложение не угадывает
 * приоритет за пользователя.
 *
 * Начальный ранг берётся у `rankBetween` для пустого квадранта, а не литералом
 * «a0»: какой ключ первый, знает библиотека дробного индексирования, и держать
 * копию этого знания у себя незачем. Во «Входящих» значение всё равно не читается
 * (порядок там по `createdAt`), а при первом попадании в квадрант ранг
 * перегенерируется по соседям приёмника — RANK_IS_QUADRANT_LOCAL.
 */
export function createTask({ id, title, text = '', now }: NewTask): Task {
  return {
    id,
    title: normalizeTaskTitle(title),
    text: normalizeTaskText(text),
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
