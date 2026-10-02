import type { SettingsRepository, TaskRepository } from './repository';

/**
 * Всё, что слой хранения отдаёт приложению на входе.
 *
 * Запасного хранилища в памяти нет: если `localStorage` недоступен, порты
 * отказывают на первом же обращении (`StorageError` вида `unavailable`),
 * а не подменяются молча. Поэтому здесь нет флага «постоянное ли хранилище» —
 * оно либо работает, либо об этом говорит `storage` в состоянии (`@/state`).
 */
export type Repositories = {
  tasks: TaskRepository;
  settings: SettingsRepository;
};
