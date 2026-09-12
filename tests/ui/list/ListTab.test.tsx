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

describe('правка задачи', () => {
  it('заголовок меняется по потере фокуса', async () => {
    await renderWithStore(<ListTab />, { stored: [task('черновик', OLD)] });

    const title: HTMLElement = within(row('черновик')).getByRole('textbox', { name: 'Заголовок' });
    await userEvent.clear(title);
    await userEvent.type(title, 'готовая спека');
    await userEvent.tab();

    expect(rowTitles('Входящие')).toEqual(['готовая спека']);
  });

  it('TITLE_IS_NOT_EMPTY: пустой заголовок откатывается к прежнему', async () => {
    await renderWithStore(<ListTab />, { stored: [task('черновик', OLD)] });

    const title: HTMLElement = within(row('черновик')).getByRole('textbox', { name: 'Заголовок' });
    await userEvent.clear(title);
    await userEvent.tab();

    expect(rowTitles('Входящие')).toEqual(['черновик']);
    expect(title).toHaveValue('черновик');
  });

  it('описание сохраняется по потере фокуса', async () => {
    const { storage } = await renderWithStore(<ListTab />, { stored: [task('спека', OLD)] });

    const text: HTMLElement = within(row('спека')).getByRole('textbox', { name: 'Описание' });
    await userEvent.type(text, 'скоуп, инварианты, критерии');
    await userEvent.tab();

    const written: Task[] = storage.saved[storage.saved.length - 1] ?? [];
    expect(written[0]?.text).toBe('скоуп, инварианты, критерии');
  });

  it('удаление убирает задачу из всех групп', async () => {
    await renderWithStore(<ListTab />, { stored: [task('лишняя', OLD)] });

    await userEvent.click(within(row('лишняя')).getByRole('button', { name: 'Удалить' }));

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

    const element: HTMLElement = row('срочная важная');
    expect(within(element).getByRole('button', { name: 'Срочная' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(element).getByRole('button', { name: 'Важная' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('нажатие переключает признак и переводит задачу в другой квадрант', async () => {
    await renderWithStore(<ListTab />, {
      stored: [task('прибраться', OLD, { assigned: true, urgent: true, important: false })],
    });

    await userEvent.click(within(row('прибраться')).getByRole('button', { name: 'Важная' }));

    const element: HTMLElement = row('прибраться');
    expect(element).toHaveAttribute('data-zone', 'Q1');
    expect(within(element).getByRole('button', { name: 'Важная' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
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
 * Раскрытие строки на узком экране (docs/specs/35-design-system.md, часть 2):
 * состояние показа живёт в самой строке, нигде не сохраняется и стор не трогает.
 *
 * Тест проверяет контракт разметки, а не ширину окна: показывать ли кнопку,
 * решает медиазапрос, а `aria-expanded` и повторный тап обязаны работать
 * одинаково при любой ширине.
 */
describe('раскрытие строки', () => {
  const expandButton = (title: string): HTMLElement => {
    return within(row(title)).getByRole('button', { name: 'Действия' });
  };

  it('тап раскрывает строку, повторный — сворачивает обратно', async () => {
    await renderWithStore(<ListTab />, { stored: [task('новая', OLD)] });

    expect(expandButton('новая')).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(expandButton('новая'));
    expect(expandButton('новая')).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(expandButton('новая'));
    expect(expandButton('новая')).toHaveAttribute('aria-expanded', 'false');
  });

  it('тап по самой строке раскрывает её, а не только по кнопке', async () => {
    await renderWithStore(<ListTab />, { stored: [task('новая', OLD)] });

    await userEvent.click(within(row('новая')).getByText('Не разобрана'));

    expect(expandButton('новая')).toHaveAttribute('aria-expanded', 'true');
  });

  it('клик по контролу строку не раскрывает: правка заголовка не складывает её', async () => {
    await renderWithStore(<ListTab />, { stored: [task('новая', OLD)] });

    await userEvent.click(within(row('новая')).getByRole('textbox', { name: 'Заголовок' }));

    expect(expandButton('новая')).toHaveAttribute('aria-expanded', 'false');
  });

  it('идемпотентность: раскрытие не пишет в хранилище', async () => {
    const { storage } = await renderWithStore(<ListTab />, { stored: [task('новая', OLD)] });

    await userEvent.click(expandButton('новая'));
    await userEvent.click(expandButton('новая'));

    expect(storage.saved).toEqual([]);
  });

  it('CONTROLS_REACHABLE_MOBILE: раскрытая строка показывает статус, признаки и удаление', async () => {
    await renderWithStore(<ListTab />, { stored: [task('новая', OLD)] });

    await userEvent.click(expandButton('новая'));

    const element: HTMLElement = row('новая');
    expect(within(element).getByRole('combobox', { name: 'Статус' })).toBeInTheDocument();
    expect(within(element).getByRole('button', { name: 'Срочная' })).toBeInTheDocument();
    expect(within(element).getByRole('button', { name: 'Важная' })).toBeInTheDocument();
    expect(within(element).getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
  });
});
