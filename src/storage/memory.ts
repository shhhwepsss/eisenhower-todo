import type { KeyValueStorage } from './types';

/**
 * Хранилище на время жизни вкладки — запасной вариант, когда `localStorage`
 * недоступен (docs/specs/4-architecture.md §3, крайние случаи).
 *
 * Это подмена хранилища, а не второй репозиторий: адаптер снапшотов остаётся
 * тем же самым, меняется только то, куда он кладёт строку. Поэтому в памяти
 * работает ровно та же проверка формы и та же атомарность записи.
 *
 * Данные не переживают перезагрузку — и это единственное отличие, о котором
 * пользователя предупреждают (фаза 5 задачи, экраны).
 */
export const createMemoryStorage = (): KeyValueStorage => {
  const values: Map<string, string> = new Map();

  return {
    getItem: (key: string): string | null => values.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      values.set(key, value);
    },
  };
};
