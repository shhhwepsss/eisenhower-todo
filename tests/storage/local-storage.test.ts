import type { MockInstance } from 'vitest';

import { createTask, sortByRank } from '@/domain';
import type { Task, UiSettings } from '@/domain';
import { SETTINGS_KEY, TASKS_KEY } from '@/storage/constants';
import { isStorageError } from '@/storage/errors';
import {
  createLocalSettingsRepository,
  createLocalTaskRepository,
} from '@/storage/local-storage';
import type { KeyValueStorage, SettingsRepository, StorageError, TaskRepository } from '@/storage';

/**
 * Подделка хранилища считает записи: STORAGE_WRITE_IS_ATOMIC — это утверждение
 * «ровно один setItem на снапшот», и проверить его можно только счётчиком.
 */
type FakeStorage = KeyValueStorage & {
  values: Map<string, string>;
  writes: number;
  failOnWrite: Error | null;
  failOnRead: Error | null;
};

const fakeStorage = (initial: Record<string, string> = {}): FakeStorage => {
  const values: Map<string, string> = new Map(Object.entries(initial));
  const fake: FakeStorage = {
    values,
    writes: 0,
    failOnWrite: null,
    failOnRead: null,
    getItem: (key: string): string | null => {
      if (fake.failOnRead) throw fake.failOnRead;
      return values.get(key) ?? null;
    },
    setItem: (key: string, value: string): void => {
      if (fake.failOnWrite) throw fake.failOnWrite;
      fake.writes += 1;
      values.set(key, value);
    },
  };
  return fake;
};

const taskAt = (id: string, now: string): Task => createTask({ id, title: `задача ${id}`, now });

const rejectionOf = async (attempt: Promise<unknown>): Promise<StorageError> => {
  try {
    await attempt;
  } catch (error) {
    if (isStorageError(error)) return error;
    throw error;
  }
  throw new Error('репозиторий не отказал там, где должен был');
};

describe('createLocalTaskRepository', () => {
  it('на пустом хранилище отдаёт пустой список: первый запуск — не отказ', async () => {
    const repository: TaskRepository = createLocalTaskRepository(fakeStorage());

    await expect(repository.loadAll()).resolves.toStrictEqual([]);
  });

  it('возвращает записанное, включая надгробия и ранги — ORDER_IS_PERSISTENT', async () => {
    const storage: FakeStorage = fakeStorage();
    const repository: TaskRepository = createLocalTaskRepository(storage);
    const saved: Task[] = [
      { ...taskAt('t1', '2026-01-01T00:00:00.000Z'), rank: 'a2' },
      { ...taskAt('t2', '2026-01-02T00:00:00.000Z'), rank: 'a0', deletedAt: '2026-02-02T12:00:00.000Z' },
      { ...taskAt('t3', '2026-01-03T00:00:00.000Z'), rank: 'a1' },
    ];

    await repository.saveAll(saved);
    const loaded: Task[] = await repository.loadAll();

    expect(loaded).toStrictEqual(saved);
    expect(sortByRank(loaded).map((task: Task) => task.id)).toStrictEqual(['t2', 't3', 't1']);
  });

  it('STORAGE_WRITE_IS_ATOMIC: снапшот уходит одним setItem', async () => {
    const storage: FakeStorage = fakeStorage();
    const repository: TaskRepository = createLocalTaskRepository(storage);

    await repository.saveAll([taskAt('t1', '2026-01-01T00:00:00.000Z'), taskAt('t2', '2026-01-02T00:00:00.000Z')]);

    expect(storage.writes).toBe(1);
    expect([...storage.values.keys()]).toStrictEqual([TASKS_KEY]);
  });

  it('идемпотентность: повторная запись того же набора даёт ту же строку', async () => {
    const storage: FakeStorage = fakeStorage();
    const repository: TaskRepository = createLocalTaskRepository(storage);
    const tasks: Task[] = [taskAt('t1', '2026-01-01T00:00:00.000Z')];

    await repository.saveAll(tasks);
    const first: string | undefined = storage.values.get(TASKS_KEY);
    await repository.saveAll(await repository.loadAll());

    expect(storage.values.get(TASKS_KEY)).toBe(first);
  });

  it('STORAGE_FAILURE_IS_VISIBLE: исчерпанная квота отдаётся наверх ошибкой', async () => {
    const storage: FakeStorage = fakeStorage();
    storage.failOnWrite = new DOMException('quota', 'QuotaExceededError');
    const repository: TaskRepository = createLocalTaskRepository(storage);

    const failure: StorageError = await rejectionOf(repository.saveAll([]));

    expect(failure.kind).toBe('write-failed');
    expect(failure.cause).toBe(storage.failOnWrite);
  });

  it('недоступное хранилище — это не повреждённые данные', async () => {
    const storage: FakeStorage = fakeStorage();
    storage.failOnRead = new DOMException('denied', 'SecurityError');
    const repository: TaskRepository = createLocalTaskRepository(storage);

    expect((await rejectionOf(repository.loadAll())).kind).toBe('unavailable');
  });

  it('повреждённый снапшот не читается и не перезаписывается', async () => {
    const raw: string = '{"version":1,"tasks":[{"id":"t1"}]}';
    const storage: FakeStorage = fakeStorage({ [TASKS_KEY]: raw });
    const repository: TaskRepository = createLocalTaskRepository(storage);

    const failure: StorageError = await rejectionOf(repository.loadAll());

    expect(failure.kind).toBe('unreadable');
    expect(failure.raw).toBe(raw);
    expect(storage.values.get(TASKS_KEY)).toBe(raw);
    expect(storage.writes).toBe(0);
  });
});

describe('createLocalSettingsRepository', () => {
  it('на пустом хранилище отдаёт настройки по умолчанию', async () => {
    const repository: SettingsRepository = createLocalSettingsRepository(fakeStorage());

    await expect(repository.load()).resolves.toStrictEqual({ listSort: 'created' });
  });

  it('возвращает записанное', async () => {
    const storage: FakeStorage = fakeStorage();
    const repository: SettingsRepository = createLocalSettingsRepository(storage);
    const settings: UiSettings = { listSort: 'quadrant' };

    await repository.save(settings);

    expect([...storage.values.keys()]).toStrictEqual([SETTINGS_KEY]);
    await expect(repository.load()).resolves.toStrictEqual(settings);
  });

  it('повреждённый снапшот настроек чинится дефолтом, а не отказом', async () => {
    const warn: MockInstance = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const storage: FakeStorage = fakeStorage({ [SETTINGS_KEY]: '{"version":' });
    const repository: SettingsRepository = createLocalSettingsRepository(storage);

    await expect(repository.load()).resolves.toStrictEqual({ listSort: 'created' });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('недоступное хранилище мягкой обработке не подлежит', async () => {
    const storage: FakeStorage = fakeStorage();
    storage.failOnRead = new DOMException('denied', 'SecurityError');
    const repository: SettingsRepository = createLocalSettingsRepository(storage);

    expect((await rejectionOf(repository.load())).kind).toBe('unavailable');
  });
});
