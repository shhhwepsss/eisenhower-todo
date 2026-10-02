import type { StorageErrorKind } from './storage-error-kind';

/**
 * Отказ хранилища — STORAGE_FAILURE_IS_VISIBLE (docs/specs/4-architecture.md §3).
 *
 * Настоящий `Error`, а не объект с полями: ошибка едет наверх через `Promise.reject`,
 * и стек места отказа — половина её ценности. Свои поля добавлены сверху, а не
 * наследованием: классов в проекте нет (CLAUDE.md §8).
 */
export type StorageError = Error & {
  kind: StorageErrorKind;
  /**
   * Строка, которую не удалось прочитать — RAW_SNAPSHOT_SURVIVES_FAILURE.
   * Это единственное, что осталось от данных пользователя, и потерять её нельзя:
   * из неё их ещё можно достать руками. `null` там, где читать было нечего:
   * отказ записи, недоступное хранилище.
   */
  raw: string | null;
};
