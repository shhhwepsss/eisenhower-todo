import { createRepositories } from '@/storage';
import { isStorageError } from '@/storage/errors';
import type { Repositories, StorageError } from '@/storage';
import type { Task } from '@/domain';

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

const rejectionOf = async (attempt: Promise<unknown>): Promise<StorageError> => {
  try {
    await attempt;
  } catch (error) {
    if (isStorageError(error)) return error;
    throw error;
  }
  throw new Error('порт не отказал там, где должен был');
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('createRepositories с работающим localStorage', () => {
  it('записанное переживает пересоздание репозиториев', async () => {
    await createRepositories().tasks.saveAll([TASK]);

    const loaded: Task[] = await createRepositories().tasks.loadAll();

    expect(loaded).toStrictEqual([TASK]);
  });
});

/**
 * Запасного хранилища в памяти больше нет (решение ревью): недоступный
 * `localStorage` — это отказ порта, а не тихая подмена реализации. Обращение
 * к `window.localStorage` ленивое (src/storage/create.ts), поэтому и в
 * приватном режиме, и при бросающемся геттере ошибка проявляется там же,
 * где обычно, — на `loadAll`/`saveAll`, а не при создании репозиториев.
 */
describe('createRepositories без localStorage', () => {
  it('запись запрещена (приватный режим): порт отказывает, данные не хранятся', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'QuotaExceededError');
    });

    const repositories: Repositories = createRepositories();

    const failure: StorageError = await rejectionOf(repositories.tasks.saveAll([TASK]));
    expect(failure.kind).toBe('write-failed');
  });

  it('обращение к самому localStorage бросает: чтение отдаёт unavailable', async () => {
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
      const repositories: Repositories = createRepositories();
      const failure: StorageError = await rejectionOf(repositories.tasks.loadAll());
      expect(failure.kind).toBe('unavailable');
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
  });
});
