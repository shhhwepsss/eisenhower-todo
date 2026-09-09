import type { MockInstance } from 'vitest';

import type { Task } from '@/domain';
import { createRepositories } from '@/storage';
import type { Repositories } from '@/storage';

const TASK: Task = {
  id: 'task-1',
  title: 'задача',
  text: '',
  assigned: false,
  urgent: false,
  important: false,
  status: 'todo',
  rank: 'a0',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
};

/** Пробу видно только по вызову: она обязана уйти из хранилища сразу же. */
const PROBE_KEY: string = 'eisenhower-todo:probe';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('createRepositories с работающим localStorage', () => {
  it('отдаёт постоянное хранилище', () => {
    expect(createRepositories().persistent).toBe(true);
  });

  it('не оставляет за собой ключ пробы', () => {
    createRepositories();

    expect(localStorage.getItem(PROBE_KEY)).toBeNull();
  });

  it('записанное переживает пересоздание репозиториев', async () => {
    await createRepositories().tasks.saveAll([TASK]);

    const loaded: Task[] = await createRepositories().tasks.loadAll();

    expect(loaded).toStrictEqual([TASK]);
  });
});

describe('createRepositories без localStorage', () => {
  it('переходит в память, когда запись запрещена: приватный режим', async () => {
    const warn: MockInstance = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'QuotaExceededError');
    });

    const repositories: Repositories = createRepositories();

    expect(repositories.persistent).toBe(false);
    expect(warn).toHaveBeenCalledOnce();
    await expect(repositories.tasks.loadAll()).resolves.toStrictEqual([]);
  });

  it('переходит в память, когда бросает само обращение к localStorage', () => {
    const warn: MockInstance = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const original: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
      window,
      'localStorage',
    );
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: (): Storage => {
        throw new DOMException('denied', 'SecurityError');
      },
    });

    try {
      expect(createRepositories().persistent).toBe(false);
      expect(warn).toHaveBeenCalledOnce();
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
  });

  it('в памяти работает тот же адаптер: сохранить и прочитать обратно', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('denied', 'QuotaExceededError');
    });
    const repositories: Repositories = createRepositories();

    await repositories.tasks.saveAll([TASK]);

    await expect(repositories.tasks.loadAll()).resolves.toStrictEqual([TASK]);
    expect(repositories.persistent).toBe(false);
  });
});
