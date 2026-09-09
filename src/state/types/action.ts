import type { ListSortKey, Neighbours, Priority, Task, TaskStatus, UiSettings, Zone } from '@/domain';

/**
 * Намерения, которые применяет редьюсер (docs/specs/4-architecture.md §5).
 *
 * Всё недетерминированное лежит в самом действии: `id` задачи и `now` генерирует
 * создатель действия на границе слоя, а не редьюсер, — REDUCER_IS_PURE. Тот же
 * `state` плюс то же действие всегда дают тот же результат, поэтому тесты обходятся
 * без фейковых таймеров и моков.
 *
 * Позицию задача получает соседями, а не строкой ранга: ранг непрозрачен для
 * вызывающей стороны (RANK_IS_OPAQUE, src/domain/types/neighbours.ts), а правило
 * «перегенерировать или сохранить» живёт в таблице `ZONE_MOVES`, и дублировать
 * его в действии значило бы завести вторую копию правила. Соседей выбирает
 * создатель действия по текущему состоянию, `rankBetween` от них детерминирован.
 *
 * Три последних действия приходят не от пользователя, а от хранилища и от вида:
 * снапшот прочитан, хранилище отказало, выбрана сортировка списка.
 */
export type Action =
  | { type: 'task/added'; id: string; title: string; text: string; now: string }
  | { type: 'task/title-edited'; id: string; title: string; now: string }
  | { type: 'task/text-edited'; id: string; text: string; now: string }
  | { type: 'task/status-set'; id: string; status: TaskStatus; between: Neighbours; now: string }
  | { type: 'task/priority-set'; id: string; priority: Priority; between: Neighbours; now: string }
  | { type: 'task/moved'; id: string; to: Zone; between: Neighbours; now: string }
  | { type: 'task/deleted'; id: string; now: string }
  | { type: 'snapshot/loaded'; tasks: Task[]; ui: UiSettings }
  | { type: 'storage/failed' }
  | { type: 'list-sort/selected'; key: ListSortKey };
