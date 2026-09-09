import type { Task, UiSettings } from '@/domain';

/**
 * Порт задач (docs/specs/4-architecture.md §4). Стор знает этот тип, реализацию
 * ему подставляют на входе в приложение — STORAGE_IS_ISOLATED.
 *
 * Асинхронный контракт при синхронной реализации — сознательно: `localStorage`
 * синхронен, серверная или IndexedDB-реализация нет. Обещание в сигнатуре сейчас
 * стоит ноль, а его отсутствие потом стоит переписывания вызывающих мест.
 */
export type TaskRepository = {
  /**
   * Все задачи снапшота, включая надгробия: их прячет выборка, а не хранилище
   * (DELETE_IS_A_TOMBSTONE). Отказ — `StorageError`.
   */
  loadAll(): Promise<Task[]>;
  /**
   * Единица записи — снапшот целиком, STORAGE_WRITE_IS_ATOMIC. Отдельного
   * `save(task)` нет и не будет: он означал бы документ, записанный наполовину.
   */
  saveAll(tasks: readonly Task[]): Promise<void>;
};

/**
 * Порт настроек (docs/specs/4-architecture.md §4). Отдельный от задач, потому что
 * отдельный снапшот: переключение сортировки не должно переписывать все задачи.
 */
export type SettingsRepository = {
  load(): Promise<UiSettings>;
  save(settings: UiSettings): Promise<void>;
};
