import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Mock } from 'vitest';

import { createTask } from '@/domain';
import type { Task } from '@/domain';
import {
  AppStateProvider,
  useInboxTasks,
  useListGroup,
  useListSort,
  useQuadrantTasks,
  useStorageStatus,
  useTaskActions,
} from '@/state';
import type { ListSort, StorageStatus, TaskActions } from '@/state';
import { storageError } from '@/storage';
import type { Repositories } from '@/storage';

/**
 * Слой состояния целиком: чтение снапшота, действия, выборки и персист
 * (docs/specs/4-architecture.md §5). Хранилище — поддельное: подставить его
 * позволяет ровно то, ради чего заведён порт (§4).
 */

const NOW: string = '2026-01-01T10:00:00.000Z';

const taskAt = (id: string, createdAt: string, patch: Partial<Task> = {}): Task => {
  const task: Task = createTask({ id, title: id, now: createdAt });
  return { ...task, ...patch };
};

const inQ1: Partial<Task> = { assigned: true, urgent: true, important: true };

type Fakes = {
  repositories: Repositories;
  loadAll: Mock;
  saveAll: Mock;
  saveSettings: Mock;
};

type FakeOptions = {
  stored?: Task[];
  loadFails?: boolean;
  saveFails?: boolean;
};

const createFakes = (options: FakeOptions = {}): Fakes => {
  const { stored = [], loadFails = false, saveFails = false } = options;

  const loadAll: Mock = vi.fn(async (): Promise<Task[]> => {
    if (loadFails) throw storageError('corrupted', 'снапшот не разбирается', { raw: '{{{' });
    return stored;
  });
  const saveAll: Mock = vi.fn(async (): Promise<void> => {
    if (saveFails) throw storageError('write-failed', 'квота исчерпана');
  });
  const saveSettings: Mock = vi.fn(async (): Promise<void> => {});

  const repositories: Repositories = {
    tasks: { loadAll, saveAll },
    settings: { load: async () => ({ listSort: 'created' }), save: saveSettings },
    persistent: true,
  };

  return { repositories, loadAll, saveAll, saveSettings };
};

type Harness = {
  actions: TaskActions;
  sort: ListSort;
  inbox: Task[];
  q1: Task[];
  listInbox: Task[];
  listAssigned: Task[];
  listDone: Task[];
  storage: StorageStatus;
};

const useHarness = (): Harness => {
  return {
    actions: useTaskActions(),
    sort: useListSort(),
    inbox: useInboxTasks(),
    q1: useQuadrantTasks('Q1'),
    listInbox: useListGroup('inbox'),
    listAssigned: useListGroup('assigned'),
    listDone: useListGroup('done'),
    storage: useStorageStatus(),
  };
};

type Rendered = { current: Harness };

/** Смонтировать стор и дождаться, пока эффект чтения снапшота отработает. */
const mountStore = async (fakes: Fakes): Promise<Rendered> => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppStateProvider repositories={fakes.repositories}>{children}</AppStateProvider>
  );

  const { result } = renderHook(useHarness, { wrapper });
  await waitFor(() => expect(fakes.loadAll).toHaveBeenCalled());
  await act(async () => {});
  return result;
};

const titles = (tasks: Task[]): string[] => tasks.map((task) => task.title);

const addTask = async (store: Rendered, title: string): Promise<Task> => {
  await act(async () => {
    store.current.actions.addTask(title);
  });
  const created: Task | undefined = store.current.inbox.find((task) => task.title === title);
  if (created === undefined) throw new Error(`задача «${title}» не появилась во «Входящих»`);
  return created;
};

/** Создать задачу и разобрать её переключателями в Q1 — то есть поставить в конец Q1. */
const addToQ1 = async (store: Rendered, title: string): Promise<Task> => {
  const created: Task = await addTask(store, title);
  await act(async () => {
    store.current.actions.setPriority(created.id, { assigned: true, urgent: true, important: true });
  });
  return created;
};

describe('старт приложения', () => {
  it('пустое хранилище: состояние пустое, storage ready, записи не было', async () => {
    const fakes: Fakes = createFakes();

    const store: Rendered = await mountStore(fakes);

    expect(store.current.inbox).toEqual([]);
    expect(store.current.storage).toBe('ready');
    expect(fakes.saveAll).not.toHaveBeenCalled();
  });

  it('ORDER_IS_PERSISTENT: порядок в квадранте берётся из рангов снапшота', async () => {
    const stored: Task[] = [
      taskAt('id-2', NOW, { ...inQ1, title: 'вторая', rank: 'a2' }),
      taskAt('id-1', NOW, { ...inQ1, title: 'первая', rank: 'a1' }),
    ];

    const store: Rendered = await mountStore(createFakes({ stored }));

    expect(titles(store.current.q1)).toEqual(['первая', 'вторая']);
  });

  it('«Входящие» упорядочены по дате создания, новые сверху', async () => {
    const stored: Task[] = [
      taskAt('id-1', '2026-01-01T10:00:00.000Z', { title: 'старая' }),
      taskAt('id-2', '2026-02-01T10:00:00.000Z', { title: 'новая' }),
    ];

    const store: Rendered = await mountStore(createFakes({ stored }));

    expect(titles(store.current.inbox)).toEqual(['новая', 'старая']);
  });
});

describe('персист', () => {
  it('после действия saveAll получает весь снапшот ровно один раз', async () => {
    const fakes: Fakes = createFakes();
    const store: Rendered = await mountStore(fakes);

    await addTask(store, 'написать спеку');

    expect(fakes.saveAll).toHaveBeenCalledTimes(1);
    expect(titles(fakes.saveAll.mock.calls[0][0])).toEqual(['написать спеку']);
  });

  it('DELETE_IS_A_TOMBSTONE: удалённая задача уезжает в снапшот надгробием', async () => {
    const fakes: Fakes = createFakes();
    const store: Rendered = await mountStore(fakes);
    const created: Task = await addTask(store, 'написать спеку');

    await act(async () => {
      store.current.actions.deleteTask(created.id);
    });

    const written: Task[] = fakes.saveAll.mock.calls.at(-1)?.[0];
    expect(written).toHaveLength(1);
    expect(written[0].deletedAt).not.toBeNull();
    expect(store.current.listInbox).toEqual([]);
  });

  it('CORRUPTED_SNAPSHOT_IS_PRESERVED: после отказа чтения не пишем ничего', async () => {
    const fakes: Fakes = createFakes({ loadFails: true });
    const store: Rendered = await mountStore(fakes);

    expect(store.current.storage).toBe('error');

    await act(async () => {
      store.current.actions.addTask('написать спеку');
    });

    expect(fakes.saveAll).not.toHaveBeenCalled();
    expect(store.current.storage).toBe('error');
  });

  it('отказ записи виден пользователю, но состояние в памяти не откатывается', async () => {
    const fakes: Fakes = createFakes({ saveFails: true });
    const store: Rendered = await mountStore(fakes);

    await act(async () => {
      store.current.actions.addTask('написать спеку');
    });

    expect(fakes.saveAll).toHaveBeenCalledTimes(1);
    expect(store.current.storage).toBe('error');
    expect(titles(store.current.inbox)).toEqual(['написать спеку']);
  });
});

describe('SINGLE_SOURCE_OF_TRUTH', () => {
  it('завершённая задача уходит из квадранта и появляется в группе «Выполненные»', async () => {
    const store: Rendered = await mountStore(createFakes());
    const created: Task = await addToQ1(store, 'написать спеку');

    expect(titles(store.current.q1)).toEqual(['написать спеку']);
    expect(titles(store.current.listAssigned)).toEqual(['написать спеку']);

    await act(async () => {
      store.current.actions.setStatus(created.id, 'done');
    });

    expect(store.current.q1).toEqual([]);
    expect(store.current.listAssigned).toEqual([]);
    expect(titles(store.current.listDone)).toEqual(['написать спеку']);
  });
});

describe('куда встаёт задача', () => {
  it('разбор переключателями ставит задачу в конец квадранта', async () => {
    const store: Rendered = await mountStore(createFakes());

    await addToQ1(store, 'первая');
    await addToQ1(store, 'вторая');

    expect(titles(store.current.q1)).toEqual(['первая', 'вторая']);
  });

  it('RANK_IS_QUADRANT_LOCAL: возврат из «Входящих» берёт соседей приёмника', async () => {
    const store: Rendered = await mountStore(createFakes());
    const first: Task = await addToQ1(store, 'первая');
    await addToQ1(store, 'вторая');

    await act(async () => {
      store.current.actions.moveToZone(first.id, 'inbox', { before: null, after: null });
    });
    expect(titles(store.current.inbox)).toEqual(['первая']);

    await act(async () => {
      store.current.actions.setPriority(first.id, { assigned: true, urgent: true, important: true });
    });

    expect(titles(store.current.q1)).toEqual(['вторая', 'первая']);
  });

  it('PRIORITY_SURVIVES_DONE: возврат из done ставит задачу в конец её квадранта', async () => {
    const store: Rendered = await mountStore(createFakes());
    const first: Task = await addToQ1(store, 'первая');
    await addToQ1(store, 'вторая');

    await act(async () => {
      store.current.actions.setStatus(first.id, 'done');
    });
    await act(async () => {
      store.current.actions.setStatus(first.id, 'todo');
    });

    expect(titles(store.current.q1)).toEqual(['вторая', 'первая']);
  });

  it('перетаскивание ставит задачу ровно между соседями', async () => {
    const store: Rendered = await mountStore(createFakes());
    await addToQ1(store, 'первая');
    await addToQ1(store, 'вторая');
    const third: Task = await addToQ1(store, 'третья');

    await act(async () => {
      const [head]: Task[] = store.current.q1;
      store.current.actions.moveToZone(third.id, 'Q1', { before: null, after: head });
    });

    expect(titles(store.current.q1)).toEqual(['третья', 'первая', 'вторая']);
  });
});

describe('сортировка списка', () => {
  it('переключение сортировки меняет порядок и не трогает снапшот задач', async () => {
    const stored: Task[] = [
      taskAt('id-1', '2026-02-01T10:00:00.000Z', { title: 'бета' }),
      taskAt('id-2', '2026-01-01T10:00:00.000Z', { title: 'альфа' }),
    ];
    const fakes: Fakes = createFakes({ stored });
    const store: Rendered = await mountStore(fakes);

    expect(titles(store.current.listInbox)).toEqual(['бета', 'альфа']);

    await act(async () => {
      store.current.sort.selectListSort('alphabet');
    });

    expect(titles(store.current.listInbox)).toEqual(['альфа', 'бета']);
    expect(fakes.saveAll).not.toHaveBeenCalled();
    expect(fakes.saveSettings).toHaveBeenCalledTimes(1);
  });
});
