import { describeError } from '@/shared/errors';

import { createLocalSettingsRepository, createLocalTaskRepository } from './local-storage';
import { log } from './log';
import { createMemoryStorage } from './memory';
import type { KeyValueStorage, Repositories } from './types';

/**
 * Вход в слой хранения: единственное место во всём приложении, где берётся
 * глобальный `localStorage` (docs/specs/4-architecture.md §4).
 */

/** Ключ пробы удаляется сразу же: хранилище должно остаться таким, каким было. */
const PROBE_KEY: string = 'eisenhower-todo:probe';

/**
 * Наличие `localStorage` проверяется записью, а не `'localStorage' in window`.
 * В приватном режиме объект на месте и `getItem` работает, а `setItem` бросает —
 * то есть «хранилище есть» и «в хранилище можно писать» это разные вопросы,
 * и приложению нужен ответ на второй.
 */
const resolveLocalStorage = (): KeyValueStorage | null => {
  try {
    const storage: Storage = window.localStorage;
    storage.setItem(PROBE_KEY, '1');
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch (error) {
    log.warn('localStorage недоступен, задачи не переживут перезагрузку', describeError(error));
    return null;
  }
};

export const createRepositories = (): Repositories => {
  const local: KeyValueStorage | null = resolveLocalStorage();
  const storage: KeyValueStorage = local ?? createMemoryStorage();

  return {
    tasks: createLocalTaskRepository(storage),
    settings: createLocalSettingsRepository(storage),
    persistent: local !== null,
  };
};
