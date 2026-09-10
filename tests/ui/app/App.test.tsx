import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Task, UiSettings } from '@/domain';
import { AppStateProvider } from '@/state';
import type { Repositories } from '@/storage';
import { App } from '@/ui/app';
import { renderWithStore } from '../../support/store';

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
      load: async (): Promise<UiSettings> => ({ listSort: 'created' }),
      save: async (): Promise<void> => {},
    },
    persistent: true,
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
});

describe('StorageBanner', () => {
  it('молчит, пока хранилище работает', async () => {
    await renderWithStore(<App />);

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('STORAGE_FAILURE_IS_VISIBLE: отказ хранилища виден на экране', async () => {
    await renderWithStore(<App />, { loadFails: true });

    expect(screen.getByRole('alert')).toHaveTextContent('не сохраняются');
  });

  it('предупреждает, что запасное хранилище не переживёт перезагрузку', async () => {
    await renderWithStore(<App />, { persistent: false });

    expect(screen.getByRole('status')).toHaveTextContent('до закрытия вкладки');
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

  it('после отказа чтения снапшота показываются вкладки и полоса ошибки, не загрузчик', async () => {
    await renderWithStore(<App />, { loadFails: true });

    expect(screen.getByRole('alert')).toHaveTextContent('не сохраняются');
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
