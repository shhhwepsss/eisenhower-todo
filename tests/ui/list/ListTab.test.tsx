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
