import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/ui/app';
import { renderWithStore } from '../../support/store';

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
