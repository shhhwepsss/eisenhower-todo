import { act, render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { Task, UiSettings } from '@/domain';
import { AppStateProvider } from '@/state';
import type { Repositories } from '@/storage';

/**
 * Поддельное хранилище для тестов интерфейса. Подставить его позволяет порт (§4):
 * экраны о хранилище не знают, а тест — знает и держит его в памяти.
 */
export type FakeStorage = {
  repositories: Repositories;
  saved: Task[][];
};

export type FakeStorageOptions = {
  stored?: Task[];
  settings?: UiSettings;
  loadFails?: boolean;
  /** Запись задач отказывает — квота, приватный режим (storage: 'write-failed'). */
  saveFails?: boolean;
  /** Уже существующее хранилище — чтобы пережить перемонтирование приложения. */
  storage?: FakeStorage;
};

export const createFakeStorage = (options: FakeStorageOptions = {}): FakeStorage => {
  const {
    stored = [],
    settings = { listSort: 'created', theme: 'system' },
    loadFails = false,
    saveFails = false,
  } = options;

  const saved: Task[][] = [];
  let current: UiSettings = settings;

  const repositories: Repositories = {
    tasks: {
      loadAll: async (): Promise<Task[]> => {
        if (loadFails) throw new Error('снапшот не читается');
        return stored;
      },
      saveAll: async (tasks: readonly Task[]): Promise<void> => {
        if (saveFails) throw new Error('квота исчерпана');
        saved.push([...tasks]);
      },
    },
    settings: {
      load: async (): Promise<UiSettings> => current,
      save: async (next: UiSettings): Promise<void> => {
        current = next;
      },
    },
  };

  return { repositories, saved };
};

export type StoreRender = RenderResult & { storage: FakeStorage };

/** Отрисовать поддеревo внутри стора и дождаться, пока снапшот прочитан. */
export const renderWithStore = async (
  ui: ReactNode,
  options: FakeStorageOptions = {},
): Promise<StoreRender> => {
  const storage: FakeStorage = options.storage ?? createFakeStorage(options);
  const rendered: RenderResult = render(
    <AppStateProvider repositories={storage.repositories}>{ui}</AppStateProvider>,
  );

  // Снапшот читается в эффекте: без этого ожидания снаружи виден загрузчик
  // (storage === 'loading'), а не смонтированные вкладки (спека §5).
  await act(async () => {});
  return Object.assign(rendered, { storage });
};
