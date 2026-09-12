import { useStore } from '../context';
import type { StorageStatus, Store } from '../types';

/**
 * Состояние связи с хранилищем — STORAGE_FAILURE_IS_VISIBLE (спека §3).
 * Что именно пошло не так, знает лог; экрану нужен только флаг.
 */
export const useStorageStatus = (): StorageStatus => {
  const { state }: Store = useStore();
  return state.storage;
};

/** Снапшот ещё не прочитан — экран показывает загрузчик вместо вкладок с задачами. */
export const useIsLoading = (): boolean => {
  const { state }: Store = useStore();
  return state.storage === 'loading';
};
