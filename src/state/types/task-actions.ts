import type { Neighbours, Priority, TaskStatus, Zone } from '@/domain';

/**
 * Всё, что интерфейс может сделать с задачами (docs/specs/4-architecture.md §5).
 *
 * Именованный тип, а не интерфейс стора: замена `useReducer` на внешний стор —
 * это переписывание тел хуков внутри `state/`, и контракт, описанный в терминах
 * `dispatch(action)`, зафиксировал бы ровно ту модель, от которой при таком
 * переезде уходят. Здесь описано намерение пользователя, а не механика доставки.
 *
 * `id`, время и ранг сюда не приходят: их генерирует реализация в `useTaskActions`.
 * Исключение — `moveToZone`: место назначает жест пользователя, и знает его только
 * вызывающая сторона. Она передаёт соседей, а не ранг, — RANK_IS_OPAQUE.
 */
export type TaskActions = {
  /** Быстрый захват (PRD S1): достаточно заголовка, задача рождается неразобранной. */
  addTask(title: string, text?: string): void;
  editTitle(id: string, title: string): void;
  editText(id: string, text: string): void;
  /** Возврат из `done` ставит задачу в конец её прежнего квадранта (PRD S6a). */
  setStatus(id: string, status: TaskStatus): void;
  /** Разбор переключателями: задача встаёт в конец квадранта-приёмника (PRD §3). */
  setPriority(id: string, priority: Priority): void;
  /** Перетаскивание: задача встаёт ровно между переданными соседями (PRD S4). */
  moveToZone(id: string, to: Zone, between: Neighbours): void;
  deleteTask(id: string): void;
};
