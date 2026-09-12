// Публичный контракт слайса: карточка матрицы, строка списка, окно правки
// и таблица подписей зон — SSOT для матрицы и списка
// (docs/specs/35-design-system.md §3, docs/specs/40-task-modal.md).
// children/, constants/, hooks/ и types/ — внутренности (SLICE_PUBLIC_API).
export { TaskCard } from './TaskCard';
export { TaskDialog } from './TaskDialog';
export { TaskRow } from './TaskRow';
export { ZONE_LABELS } from './constants';
export { useTaskDialog } from './hooks/use-task-dialog';
export type { TaskDialogState } from './hooks/use-task-dialog';
