import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTask } from '@/domain';
import type { Task } from '@/domain';
import { ListTab } from '@/ui/list';
import { renderWithStore } from '../../support/store';

/**
 * Вкладка «Список» (PRD §3): полный инвентарь, три группы, работа с задачей.
 * Проверяется то, что видит пользователь, а не то, какие хуки вызвались.
 */

const task = (title: string, createdAt: string, patch: Partial<Task> = {}): Task => {
  const created: Task = createTask({ id: title, title, now: createdAt });
  return { ...created, ...patch };
};

const OLD: string = '2026-01-01T10:00:00.000Z';
const NEW: string = '2026-02-01T10:00:00.000Z';

const group = (name: string): HTMLElement => screen.getByRole('region', { name });

const rowTitles = (name: string): string[] => {
  const rows: HTMLElement[] = within(group(name)).queryAllByRole('article');
  return rows.map((row) => row.getAttribute('aria-label') ?? '');
};

const row = (title: string): HTMLElement => screen.getByRole('article', { name: title });

/**
 * Правка задачи живёт в окне (issue #40, ONE_EDIT_SURFACE), и открывает его
 * клик по строке. Строка сама по себе — представление: полей в ней нет.
 *
 * Пока окно открыто, остальная страница спрятана из дерева доступности — так
 * ведёт себя модальное окно, и `getByRole` до строк списка не достаёт. Поэтому
 * проверки списка идут после закрытия окна, а не рядом с правкой.
 */
const open = async (title: string): Promise<HTMLElement> => {
  await userEvent.click(row(title));
  return screen.getByRole('dialog');
};

describe('создание задачи', () => {
  it('S1: заголовок и Enter создают задачу во «Входящих»', async () => {
    await renderWithStore(<ListTab />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Новая задача' }), 'написать спеку{Enter}');

    expect(rowTitles('Входящие')).toEqual(['написать спеку']);
    expect(screen.getByRole('textbox', { name: 'Новая задача' })).toHaveValue('');
  });

  it('пустой ввод гасит форма: кнопка недоступна', async () => {
    await renderWithStore(<ListTab />);

    expect(screen.getByRole('button', { name: 'Добавить' })).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox', { name: 'Новая задача' }), '   ');

    expect(screen.getByRole('button', { name: 'Добавить' })).toBeDisabled();
  });
});

describe('LIST_PARTITION', () => {
  it('каждая задача ровно в одной группе, пустые группы остаются на экране', async () => {
    await renderWithStore(<ListTab />, {
      stored: [
        task('неразобранная', OLD),
        task('разобранная', OLD, { assigned: true, urgent: true, important: true }),
        task('сделанная', OLD, { status: 'done' }),
      ],
    });

    expect(rowTitles('Входящие')).toEqual(['неразобранная']);
    expect(rowTitles('В квадранте')).toEqual(['разобранная']);
    expect(rowTitles('Выполненные')).toEqual(['сделанная']);
  });

  it('LIST_IS_COMPLETE: завершённая задача остаётся видимой в списке', async () => {
    await renderWithStore(<ListTab />, {
      stored: [task('написать спеку', OLD, { assigned: true, urgent: true, important: true })],
    });

    await userEvent.selectOptions(
      within(row('написать спеку')).getByRole('combobox', { name: 'Статус' }),
      'done',
    );

    expect(rowTitles('В квадранте')).toEqual([]);
    expect(rowTitles('Выполненные')).toEqual(['написать спеку']);
  });
});

describe('правка задачи в окне', () => {
  it('заголовок меняется по потере фокуса', async () => {
    await renderWithStore(<ListTab />, { stored: [task('черновик', OLD)] });

    const dialog: HTMLElement = await open('черновик');
    const title: HTMLElement = within(dialog).getByRole('textbox', { name: 'Заголовок' });
    await userEvent.clear(title);
    await userEvent.type(title, 'готовая спека');
    await userEvent.keyboard('{Escape}');

    expect(rowTitles('Входящие')).toEqual(['готовая спека']);
  });

  it('TITLE_IS_NOT_EMPTY: пустой заголовок откатывается к прежнему', async () => {
    await renderWithStore(<ListTab />, { stored: [task('черновик', OLD)] });

    const dialog: HTMLElement = await open('черновик');
    const title: HTMLElement = within(dialog).getByRole('textbox', { name: 'Заголовок' });
    await userEvent.clear(title);
    await userEvent.keyboard('{Escape}');

    expect(title).toHaveValue('черновик');
    expect(rowTitles('Входящие')).toEqual(['черновик']);
  });

  it('описание сохраняется по потере фокуса', async () => {
    const { storage } = await renderWithStore(<ListTab />, { stored: [task('спека', OLD)] });

    const dialog: HTMLElement = await open('спека');
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Описание' }),
      'скоуп, инварианты, критерии',
    );
    await userEvent.keyboard('{Escape}');

    const written: Task[] = storage.saved[storage.saved.length - 1] ?? [];
    expect(written[0]?.text).toBe('скоуп, инварианты, критерии');
  });

  it('удаление убирает задачу из всех групп', async () => {
    await renderWithStore(<ListTab />, { stored: [task('лишняя', OLD)] });

    const dialog: HTMLElement = await open('лишняя');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }));


    expect(rowTitles('Входящие')).toEqual([]);
    expect(rowTitles('В квадранте')).toEqual([]);
    expect(rowTitles('Выполненные')).toEqual([]);
  });
});

/**
 * Цвет зоны в списке (docs/specs/35-design-system.md §3, критерии приёмки):
 * задача из Q1 показывает и полосу, и подпись зоны — цвет не остаётся
 * единственным носителем смысла (COLOR_NOT_ALONE). Подпись берётся из той же
 * таблицы `ZONE_LABELS`, что и заголовки квадрантов в матрице (SSOT) —
 * «Делать сейчас», а не «Сделать».
 */
describe('цвет зоны в строке списка', () => {
  it('строка задачи из Q1 несёт data-zone="Q1" и подпись зоны как в матрице', async () => {
    await renderWithStore(<ListTab />, {
      stored: [task('срочная важная', OLD, { assigned: true, urgent: true, important: true })],
    });

    const element: HTMLElement = row('срочная важная');
    expect(element).toHaveAttribute('data-zone', 'Q1');
    expect(within(element).getByText('Делать сейчас')).toBeInTheDocument();
  });

  /**
   * Дефект визуальной проверки: у строки из «Входящих» подпись зоны дублировала
   * заголовок группы «Входящие» прямо под ним. Плашка остаётся у всех зон —
   * без неё заголовки соседних строк начинались бы с разных мест, — но говорит
   * о состоянии задачи, а не повторяет название группы.
   */
  it('у неразобранной задачи плашка говорит «Не разобрана», а не повторяет заголовок группы', async () => {
    await renderWithStore(<ListTab />, { stored: [task('новая', OLD)] });

    const element: HTMLElement = row('новая');
    expect(element).toHaveAttribute('data-zone', 'inbox');
    expect(within(element).getByText('Не разобрана')).toBeInTheDocument();
    expect(within(element).queryByText('Входящие')).toBeNull();
  });
});

/**
 * Признаки — кнопки с `aria-pressed`, а не флажки (docs/specs/35-design-system.md,
 * часть 2): включённое состояние различается не только инверсной заливкой,
 * и это COLOR_NOT_ALONE.
 */
describe('переключатели признаков', () => {
  it('включённый признак читается как нажатая кнопка, а не только заливкой', async () => {
    await renderWithStore(<ListTab />, {
      stored: [task('срочная важная', OLD, { assigned: true, urgent: true, important: false })],
    });

    const dialog: HTMLElement = await open('срочная важная');

    expect(within(dialog).getByRole('button', { name: 'Срочная' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(dialog).getByRole('button', { name: 'Важная' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('нажатие переключает признак и переводит задачу в другой квадрант', async () => {
    await renderWithStore(<ListTab />, {
      stored: [task('прибраться', OLD, { assigned: true, urgent: true, important: false })],
    });

    const dialog: HTMLElement = await open('прибраться');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Важная' }));
    await userEvent.keyboard('{Escape}');

    expect(row('прибраться')).toHaveAttribute('data-zone', 'Q1');
    expect(rowTitles('В квадранте')).toEqual(['прибраться']);
  });
});

describe('сортировка', () => {
  it('S4a: алфавитная сортировка меняет порядок внутри группы', async () => {
    await renderWithStore(<ListTab />, {
      stored: [task('яблоко', NEW), task('арбуз', OLD)],
    });

    expect(rowTitles('Входящие')).toEqual(['яблоко', 'арбуз']);

    await userEvent.selectOptions(screen.getByRole('combobox', { name: /Сортировка/ }), 'alphabet');

    expect(rowTitles('Входящие')).toEqual(['арбуз', 'яблоко']);
  });

  it('DERIVED_ORDER_IS_NOT_STORED: сортировка не переписывает снапшот задач', async () => {
    const { storage } = await renderWithStore(<ListTab />, {
      stored: [task('яблоко', NEW), task('арбуз', OLD)],
    });

    await userEvent.selectOptions(screen.getByRole('combobox', { name: /Сортировка/ }), 'alphabet');

    expect(storage.saved).toEqual([]);
  });
});

/**
 * Открытие окна со вкладки «Список» (issue #40). Раскрытие строки отсюда ушло:
 * прятать стало нечего, а один клик не может значить и «раскрыть», и «открыть».
 */
describe('открытие окна со строки', () => {
  it('клик по строке открывает окно этой задачи', async () => {
    await renderWithStore(<ListTab />, { stored: [task('новая', OLD)] });

    const dialog: HTMLElement = await open('новая');

    expect(dialog).toHaveAccessibleName('новая');
  });

  it('ONE_EDIT_SURFACE: в строке нет ни полей правки, ни признаков, ни удаления', async () => {
    await renderWithStore(<ListTab />, { stored: [task('новая', OLD)] });

    const element: HTMLElement = row('новая');

    expect(within(element).queryAllByRole('textbox')).toEqual([]);
    expect(within(element).queryAllByRole('button')).toEqual([]);
    expect(within(element).getByRole('combobox', { name: 'Статус' })).toBeInTheDocument();
  });

  it('CONTROLS_KEEP_THEIR_PRESS: клик по статусу окно не открывает', async () => {
    await renderWithStore(<ListTab />, {
      stored: [task('новая', OLD, { assigned: true, urgent: true, important: true })],
    });

    await userEvent.selectOptions(
      within(row('новая')).getByRole('combobox', { name: 'Статус' }),
      'in_progress',
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('CONTROLS_REACHABLE_MOBILE: окно показывает статус, признаки и удаление', async () => {
    await renderWithStore(<ListTab />, { stored: [task('новая', OLD)] });

    const dialog: HTMLElement = await open('новая');

    expect(within(dialog).getByRole('combobox', { name: 'Статус' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Срочная' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Важная' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
  });

  it('идемпотентность: открытие и закрытие окна в хранилище не пишет', async () => {
    const { storage } = await renderWithStore(<ListTab />, { stored: [task('новая', OLD)] });

    await open('новая');
    await userEvent.keyboard('{Escape}');
    await open('новая');
    await userEvent.keyboard('{Escape}');

    expect(storage.saved).toEqual([]);
  });
});
