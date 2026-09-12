import type { Task, UiSettings } from '@/domain';

import type { StorageStatus } from './storage-status';

/**
 * Всё состояние приложения (docs/specs/4-architecture.md §5).
 *
 * Один массив задач на обе вкладки — SINGLE_SOURCE_OF_TRUTH: копий нет,
 * значит и расходиться нечему. Матрица и список — выборки над этим массивом,
 * а не отдельные коллекции.
 *
 * Надгробия лежат здесь же: их прячет выборка, а не хранилище и не редьюсер
 * (DELETE_IS_A_TOMBSTONE).
 */
export type AppState = {
  tasks: Task[];
  ui: UiSettings;
  storage: StorageStatus;
};
