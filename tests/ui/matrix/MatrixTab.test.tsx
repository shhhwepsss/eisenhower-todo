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
  const cards: HTMLElement[] = within(zone(name)).queryAllByRole('article');
  return cards.map((card) => card.getAttribute('aria-label') ?? '');
};

const card = (title: string): HTMLElement => screen.getByRole('article', { name: title });

/**
 * Признаки разбора живут в окне задачи, а не на карточке (issue #40,
 * ONE_EDIT_SURFACE), поэтому разбор здесь — это открыть задачу, переключить
 * признаки и закрыть окно.
 *
 * Переключатели — кнопки с `aria-pressed`, а не флажки
 * (docs/specs/35-design-system.md, часть 2): включённое состояние читается
 * голосом, а не только инверсной заливкой (COLOR_NOT_ALONE).
 */
const assign = async (title: string, flags: readonly string[]): Promise<void> => {
  await userEvent.click(card(title));

  const dialog: HTMLElement = screen.getByRole('dialog');
  for (const flag of flags) {
    await userEvent.click(within(dialog).getByRole('button', { name: flag }));
  }

  await userEvent.keyboard('{Escape}');
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

describe('разбор признаками в окне задачи', () => {
  it('оба признака переносят задачу из «Входящих» в Q1', async () => {
    await renderWithStore(<MatrixTab />, { stored: [task('написать спеку', OLD)] });

    await assign('написать спеку', ['Срочная', 'Важная']);

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

    await assign('вторая', ['Срочная', 'Важная']);

    expect(cardTitles('Делать сейчас')).toEqual(['первая', 'вторая']);
  });

  it('снятые оба флажка оставляют задачу разобранной — это Q4, а не «Входящие»', async () => {
    await renderWithStore(<MatrixTab />, {
      stored: [task('прибраться', OLD, { assigned: true, urgent: true, important: false })],
    });

    expect(cardTitles('Минимизировать')).toEqual(['прибраться']);

    await assign('прибраться', ['Срочная']);

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
      within(card('написать спеку')).getByRole('combobox', { name: 'Статус' }),
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

/**
 * Ручка перетаскивания живёт внутри карточки, слева от заголовка
 * (docs/specs/35-design-system.md, часть 2, критерии приёмки). Жест при этом
 * берётся за всю карточку (issue #38), а ручка держит клавиатурный путь.
 */
describe('ручка перетаскивания', () => {
  it('у карточки есть своя ручка, и она названа задачей', async () => {
    await renderWithStore(<MatrixTab />, { stored: [task('написать спеку', OLD)] });

    const handle: HTMLElement = within(card('написать спеку')).getByRole('button', {
      name: 'Перетащить «написать спеку»',
    });

    expect(handle).toBeInTheDocument();
  });

  it('ONE_EDIT_SURFACE: кроме ручки, кнопок на карточке нет — признаки уехали в окно', async () => {
    await renderWithStore(<MatrixTab />, { stored: [task('написать спеку', OLD)] });

    const buttons: HTMLElement[] = within(card('написать спеку')).getAllByRole('button');

    expect(buttons.map((button) => button.getAttribute('aria-label') ?? button.textContent)).toEqual(
      ['Перетащить «написать спеку»'],
    );
  });
});
