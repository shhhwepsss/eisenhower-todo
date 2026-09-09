import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTask } from '@/domain';
import type { Task } from '@/domain';
import { MatrixTab } from '@/ui/matrix';
import { renderWithStore } from '../../support/store';

/**
 * Вкладка «Матрица» (PRD §3). Проверяется то, что видит пользователь: где задача
 * лежит и что с ней происходит после разбора, — а не то, какие хуки вызвались.
 */

const task = (title: string, createdAt: string, patch: Partial<Task> = {}): Task => {
  const created: Task = createTask({ id: title, title, now: createdAt });
  return { ...created, ...patch };
};

const OLD: string = '2026-01-01T10:00:00.000Z';
const NEW: string = '2026-02-01T10:00:00.000Z';

const zone = (name: string): HTMLElement => screen.getByRole('region', { name });

const cardTitles = (name: string): string[] => {
  const headings: HTMLElement[] = within(zone(name)).queryAllByRole('heading', { level: 3 });
  return headings.map((heading) => heading.textContent ?? '');
};

describe('зона «Входящие»', () => {
  it('DERIVED_ORDER_IS_NOT_STORED: порядок по дате создания, новые сверху', async () => {
    await renderWithStore(<MatrixTab />, {
      stored: [task('старая', OLD), task('новая', NEW)],
    });

    expect(cardTitles('Входящие')).toEqual(['новая', 'старая']);
  });

  it('пустая зона говорит об этом словами, а не пустотой', async () => {
    await renderWithStore(<MatrixTab />);

    expect(within(zone('Входящие')).getByText('Всё разобрано')).toBeInTheDocument();
  });
});

describe('разбор переключателями', () => {
  it('оба признака переносят задачу из «Входящих» в Q1', async () => {
    await renderWithStore(<MatrixTab />, { stored: [task('написать спеку', OLD)] });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Срочная: «написать спеку»' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Важная: «написать спеку»' }));

    expect(cardTitles('Входящие')).toEqual([]);
    expect(cardTitles('Делать сейчас')).toEqual(['написать спеку']);
  });

  it('разобранная задача встаёт в конец квадранта', async () => {
    await renderWithStore(<MatrixTab />, {
      stored: [
        task('первая', OLD, { assigned: true, urgent: true, important: true, rank: 'a1' }),
        task('вторая', NEW),
      ],
    });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Срочная: «вторая»' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Важная: «вторая»' }));

    expect(cardTitles('Делать сейчас')).toEqual(['первая', 'вторая']);
  });

  it('снятые оба флажка оставляют задачу разобранной — это Q4, а не «Входящие»', async () => {
    await renderWithStore(<MatrixTab />, {
      stored: [task('прибраться', OLD, { assigned: true, urgent: true, important: false })],
    });

    expect(cardTitles('Минимизировать')).toEqual(['прибраться']);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Срочная: «прибраться»' }));

    expect(cardTitles('Не делать')).toEqual(['прибраться']);
    expect(cardTitles('Входящие')).toEqual([]);
  });
});

describe('DONE_LEAVES_MATRIX', () => {
  it('завершённая задача исчезает с вкладки целиком', async () => {
    await renderWithStore(<MatrixTab />, {
      stored: [task('написать спеку', OLD, { assigned: true, urgent: true, important: true })],
    });

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Статус задачи «написать спеку»' }),
      'done',
    );

    expect(cardTitles('Делать сейчас')).toEqual([]);
    expect(cardTitles('Входящие')).toEqual([]);
  });

  it('завершённая задача не показывается и во «Входящих»', async () => {
    await renderWithStore(<MatrixTab />, {
      stored: [task('забытая', OLD, { status: 'done' })],
    });

    expect(cardTitles('Входящие')).toEqual([]);
  });
});
