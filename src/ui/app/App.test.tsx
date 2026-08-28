import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

describe('App', () => {
  it('показывает две вкладки, «Список» активна по умолчанию', () => {
    render(<App />);

    expect(screen.getByRole('tab', { name: 'Список' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Матрица' })).toHaveAttribute('aria-selected', 'false');
  });

  it('переключает панель по клику на вкладку', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('tab', { name: 'Матрица' }));

    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'panel-matrix');
    expect(screen.getByRole('tab', { name: 'Матрица' })).toHaveAttribute('aria-selected', 'true');
  });
});
