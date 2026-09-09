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

/**
 * Переживут ли задачи перезагрузку. Отдельный вопрос от отказа: писать удаётся,
 * но пишем в память — запасное хранилище (спека §3). Пользователю это нужно
 * сказать заранее, а не после потери.
 */
export const useStorageIsPersistent = (): boolean => {
  const { state }: Store = useStore();
  return state.persistent;
};
