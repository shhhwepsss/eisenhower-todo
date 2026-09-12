/**
 * Публичный контракт слоя состояния (docs/specs/4-architecture.md §5).
 *
 * Наружу торчат провайдер и хуки — и это весь шов. Редьюсер, действия и Context
 * приватны: `ui/` их не импортирует, и это держит линтер, а не договорённость
 * (STATE_ACCESS_VIA_HOOKS, eslint.config.js).
 *
 * Хуки-чтения написаны в форме селекторов — принимают зону и отдают готовый срез.
 * Тогда замена `useReducer` на внешний стор меняет только тела хуков внутри слоя:
 * сигнатуры уже совпадают с формой селектора.
 */
export { AppStateProvider } from './AppStateProvider';
export { useListGroup } from './hooks/use-list-group';
export { useListSort } from './hooks/use-list-sort';
export { useInboxTasks, useQuadrantTasks } from './hooks/use-matrix-tasks';
export { useMatrixZones } from './hooks/use-matrix-zones';
export { useIsLoading, useStorageStatus } from './hooks/use-storage-status';
export { useTaskActions } from './hooks/use-task-actions';
export type { ListSort } from './hooks/use-list-sort';
export type { MatrixZones } from './hooks/use-matrix-zones';
export type { StorageStatus, TaskActions } from './types';
