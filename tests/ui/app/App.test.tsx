import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Task, UiSettings } from '@/domain';
import { AppStateProvider } from '@/state';
import type { Repositories } from '@/storage';
import { App } from '@/ui/app';
import { renderWithStore } from '../../support/store';
import type { StoreRender } from '../../support/store';

/**
 * Хранилище с управляемым чтением снапшота: `loadAll` не отвечает, пока тест
 * сам не позовёт `resolveLoad`. Смонтировано напрямую через `AppStateProvider`,
 * а не через `renderWithStore` — тот дожидается конца загрузки, а здесь нужен
 * именно кадр, где storage ещё 'loading'.
 */
type DeferredStorage = {
  repositories: Repositories;
  resolveLoad: (tasks: Task[]) => void;
};

const createDeferredStorage = (): DeferredStorage => {
  let resolve: (tasks: Task[]) => void = () => {};

  const repositories: Repositories = {
    tasks: {
      loadAll: (): Promise<Task[]> => {
        return new Promise<Task[]>((res) => {
          resolve = res;
        });
      },
      saveAll: async (): Promise<void> => {},
    },
    settings: {
      load: async (): Promise<UiSettings> => ({ listSort: 'created', theme: 'system' }),
      save: async (): Promise<void> => {},
    },
  };

  // Обёртка, а не сам resolve: к моменту деструктуризации в тесте loadAll ещё
  // не вызван, и переприсвоенный resolve иначе не будет виден снаружи.
  const resolveLoad = (tasks: Task[]): void => resolve(tasks);

  return { repositories, resolveLoad };
};

describe('App', () => {
  it('показывает две вкладки, «Список» активна по умолчанию', async () => {
    await renderWithStore(<App />);

    expect(screen.getByRole('tab', { name: 'Список' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Матрица' })).toHaveAttribute('aria-selected', 'false');
  });

  it('переключает панель по клику на вкладку', async () => {
    await renderWithStore(<App />);

    await userEvent.click(screen.getByRole('tab', { name: 'Матрица' }));

    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'panel-matrix');
    expect(screen.getByRole('tab', { name: 'Матрица' })).toHaveAttribute('aria-selected', 'true');
  });

  it('пока хранилище работает, полосы ошибки нет', async () => {
    await renderWithStore(<App />);

    expect(screen.queryByRole('alert')).toBeNull();
  });
});

/**
 * Решение владельца продукта: запасного хранилища в памяти больше нет.
 * Отказ на старте (снапшот не прочитан) — это `storage: 'unavailable'`,
 * и экран при нём показывает отказ вместо вкладок целиком: задач ещё нет,
 * и терять нечего — правильно заблокировать работу (STORAGE_FAILURE_IS_VISIBLE).
 */
describe('AppStorageError: отказ на старте', () => {
  it('STORAGE_FAILURE_IS_VISIBLE: отказ хранилища виден на экране вместо вкладок', async () => {
    await renderWithStore(<App />, { loadFails: true });

    expect(screen.getByRole('alert')).toHaveTextContent('Хранилище недоступно');
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('при отказе хранилища создать задачу нельзя: в интерфейсе нет вкладок с задачами', async () => {
    await renderWithStore(<App />, { loadFails: true });

    expect(screen.queryByRole('button', { name: /добавить/i })).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});

/**
 * Регрессия ревью: отказ записи ПОСРЕДИ сессии — это другая беда, чем отказ
 * на старте. Задачи уже созданы и лежат в состоянии, и полноэкранная ошибка
 * их бы спрятала. Вкладки остаются смонтированными, задача видна на экране,
 * а отказ виден постоянным баннером `StorageBanner` — STORAGE_FAILURE_IS_VISIBLE
 * без потери данных пользователя (docs/specs/4-architecture.md §3).
 */
describe('StorageBanner: отказ записи посреди сессии', () => {
  it('после отказа записи вкладки остаются, задача видна, и виден баннер отказа', async () => {
    const rendered: StoreRender = await renderWithStore(<App />, { saveFails: true });

    await userEvent.type(screen.getByLabelText('Новая задача'), 'написать спеку{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('не сохраняются');
    });
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByDisplayValue('написать спеку')).toBeInTheDocument();
    expect(rendered.storage.saved).toHaveLength(0);
  });

  it('после отказа записи повторная правка не пишется снова: персист выключен', async () => {
    await renderWithStore(<App />, { saveFails: true });

    await userEvent.type(screen.getByLabelText('Новая задача'), 'написать спеку{Enter}');
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText('Новая задача'), 'вторая задача{Enter}');

    expect(screen.getByDisplayValue('написать спеку')).toBeInTheDocument();
    expect(screen.getByDisplayValue('вторая задача')).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});

describe('AppLoader', () => {
  it('пока снапшот не прочитан — виден загрузчик, вкладок нет', () => {
    const { repositories } = createDeferredStorage();

    render(
      <AppStateProvider repositories={repositories}>
        <App />
      </AppStateProvider>,
    );

    const loader: HTMLElement = screen.getByRole('status');
    expect(loader).toHaveAttribute('aria-busy', 'true');
    expect(loader).toHaveTextContent('Загружаем задачи');
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('после чтения снапшота загрузчик уходит, а вкладки появляются', async () => {
    const { repositories, resolveLoad } = createDeferredStorage();

    render(
      <AppStateProvider repositories={repositories}>
        <App />
      </AppStateProvider>,
    );

    await act(async () => {
      resolveLoad([]);
    });
    await waitFor(() => expect(screen.getByRole('tablist')).toBeInTheDocument());

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('после отказа чтения снапшота показывается экран ошибки, не загрузчик и не вкладки', async () => {
    await renderWithStore(<App />, { loadFails: true });

    expect(screen.getByRole('alert')).toHaveTextContent('Хранилище недоступно');
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
