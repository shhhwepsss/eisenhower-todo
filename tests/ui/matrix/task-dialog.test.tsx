import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTask } from '@/domain';
import type { Task } from '@/domain';
import { MatrixTab } from '@/ui/matrix';
import { renderWithStore } from '../../support/store';

/**
 * Окно правки задачи, открытое с «Матрицы» (issue #40).
 *
 * Проверяется наблюдаемое: что видно в окне, что происходит после правки и что
 * остаётся на карточке, — а не внутренности `@radix-ui/react-dialog`. Ловушка
 * фокуса и возврат фокуса — его работа, и переписывать её тестом незачем;
 * проверяется только то, что фокус действительно уходит внутрь окна.
 *
 * Чтобы упасть, тестам нужно: снятый обработчик клика на карточке (первый),
 * пропавший отбор контролов (второй), разошедшиеся карточка и окно (третий,
 * MODAL_IS_SHARED).
 */

const NOW: string = '2026-01-01T10:00:00.000Z';

const task = (title: string, patch: Partial<Task> = {}): Task => {
  const created: Task = createTask({ id: title, title, now: NOW });
  return { ...created, ...patch };
};

const card = (title: string): HTMLElement => screen.getByRole('article', { name: title });

const dialog = (): HTMLElement => screen.getByRole('dialog');

const open = async (title: string): Promise<HTMLElement> => {
  await userEvent.click(card(title));
  return dialog();
};

describe('открытие окна', () => {
  it('клик по карточке открывает окно этой задачи', async () => {
    await renderWithStore(<MatrixTab />, { stored: [task('написать спеку')] });

    const opened: HTMLElement = await open('написать спеку');

    expect(opened).toHaveAccessibleName('написать спеку');
  });

  it('CONTROLS_KEEP_THEIR_PRESS: клик по статусу меняет статус и окно не открывает', async () => {
    await renderWithStore(<MatrixTab />, { stored: [task('написать спеку')] });

    await userEvent.selectOptions(
      within(card('написать спеку')).getByRole('combobox', { name: 'Статус' }),
      'in_progress',
    );

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(within(card('написать спеку')).getByRole('combobox', { name: 'Статус' })).toHaveValue(
      'in_progress',
    );
  });

  it('фокус уезжает внутрь окна, а не остаётся на странице', async () => {
    await renderWithStore(<MatrixTab />, { stored: [task('написать спеку')] });

    const opened: HTMLElement = await open('написать спеку');

    expect(opened.contains(document.activeElement)).toBe(true);
  });
});

describe('правка полей', () => {
  it('название правится в окне и видно на карточке после закрытия', async () => {
    await renderWithStore(<MatrixTab />, { stored: [task('черновик')] });

    const opened: HTMLElement = await open('черновик');
    const title: HTMLElement = within(opened).getByRole('textbox', { name: 'Заголовок' });
    await userEvent.clear(title);
    await userEvent.type(title, 'написать спеку');
    await userEvent.keyboard('{Escape}');

    expect(card('написать спеку')).toBeInTheDocument();
  });

  it('NO_LOST_EDIT: описание сохраняется и видно при повторном открытии', async () => {
    await renderWithStore(<MatrixTab />, { stored: [task('написать спеку')] });

    const opened: HTMLElement = await open('написать спеку');
    await userEvent.type(
      within(opened).getByRole('textbox', { name: 'Описание' }),
      'выписать инварианты',
    );
    await userEvent.keyboard('{Escape}');

    const reopened: HTMLElement = await open('написать спеку');

    expect(within(reopened).getByRole('textbox', { name: 'Описание' })).toHaveValue(
      'выписать инварианты',
    );
  });

  it('QUADRANT_IS_DERIVED: квадрант показан, но отдельного контрола для него нет', async () => {
    await renderWithStore(<MatrixTab />, {
      stored: [task('написать спеку', { assigned: true, urgent: true, important: true })],
    });

    const opened: HTMLElement = await open('написать спеку');

    expect(within(opened).getByText('Делать сейчас')).toBeInTheDocument();
    expect(within(opened).queryByRole('button', { name: 'Делать сейчас' })).toBeNull();
    expect(within(opened).queryByRole('combobox', { name: 'Квадрант' })).toBeNull();
  });
});

describe('закрытие окна', () => {
  it('Escape закрывает окно', async () => {
    await renderWithStore(<MatrixTab />, { stored: [task('написать спеку')] });

    await open('написать спеку');
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('кнопка «Закрыть» закрывает окно', async () => {
    await renderWithStore(<MatrixTab />, { stored: [task('написать спеку')] });

    const opened: HTMLElement = await open('написать спеку');
    await userEvent.click(within(opened).getByRole('button', { name: 'Закрыть' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('удаление из окна закрывает его и убирает задачу с вкладки', async () => {
    await renderWithStore(<MatrixTab />, { stored: [task('написать спеку')] });

    const opened: HTMLElement = await open('написать спеку');
    await userEvent.click(within(opened).getByRole('button', { name: 'Удалить' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('article', { name: 'написать спеку' })).toBeNull();
  });

  it('идемпотентность: повторный клик по той же задаче ничего не ломает', async () => {
    await renderWithStore(<MatrixTab />, { stored: [task('написать спеку')] });

    await open('написать спеку');
    await userEvent.keyboard('{Escape}');
    const reopened: HTMLElement = await open('написать спеку');

    expect(reopened).toHaveAccessibleName('написать спеку');
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });
});
