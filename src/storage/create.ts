import { createLocalSettingsRepository, createLocalTaskRepository } from './local-storage';
import type { KeyValueStorage, Repositories } from './types';

/**
 * Вход в слой хранения: единственное место во всём приложении, где берётся
 * глобальный `localStorage` (docs/specs/4-architecture.md §4).
 *
 * Обращение ленивое: сам `window.localStorage` не читается здесь и не пробуется
 * заранее. Если он недоступен — это выяснится на первом же `getItem`/`setItem`
 * внутри `read`/`write` (src/storage/local-storage.ts), и наружу уйдёт
 * `StorageError` с видом `unavailable`. Решение владельца продукта: запасного
 * хранилища в памяти больше нет — недоступный `localStorage` это отказ
 * (`storage: 'unavailable'` в состоянии, см. `@/state`), а не тихий переход
 * на данные, которые не переживут перезагрузку.
 */
const windowStorage: KeyValueStorage = {
  getItem: (key: string): string | null => window.localStorage.getItem(key),
  setItem: (key: string, value: string): void => {
    window.localStorage.setItem(key, value);
  },
};

export const createRepositories = (): Repositories => {
  return {
    tasks: createLocalTaskRepository(windowStorage),
    settings: createLocalSettingsRepository(windowStorage),
  };
};
