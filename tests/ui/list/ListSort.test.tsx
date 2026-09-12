import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTask } from '@/domain';
import type { Task } from '@/domain';
import { ListTab } from '@/ui/list';
import { createFakeStorage, renderWithStore } from '../../support/store';
import type { FakeStorage } from '../../support/store';

/**
 * Выбранная сортировка переживает перезагрузку (PRD §6, спека §8).
 *
 * «Перезагрузка» здесь — это второе монтирование приложения поверх того же
 * хранилища: ровно то, что делает браузер при F5, и ровно то, что должно
 * восстановиться из снапшота настроек.
 */

const NOW: string = '2026-01-01T10:00:00.000Z';

const task = (title: string, createdAt: string): Task => {
  return createTask({ id: title, title, now: createdAt });
};

const inboxTitles = (): string[] => {
  const group: HTMLElement = screen.getByRole('region', { name: 'Входящие' });
  return within(group)
    .queryAllByRole('article')
    .map((row) => row.getAttribute('aria-label') ?? '');
};

const sortSelect = (): HTMLElement => screen.getByRole('combobox', { name: /Сортировка/ });

describe('сортировка списка между сессиями', () => {
  it('выбор переживает перемонтирование приложения', async () => {
    const storage: FakeStorage = createFakeStorage({
      stored: [task('яблоко', '2026-02-01T10:00:00.000Z'), task('арбуз', NOW)],
    });

    await renderWithStore(<ListTab />, { storage });
    await userEvent.selectOptions(sortSelect(), 'alphabet');
    expect(inboxTitles()).toEqual(['арбуз', 'яблоко']);

    cleanup();
    await renderWithStore(<ListTab />, { storage });

    expect(sortSelect()).toHaveValue('alphabet');
    expect(inboxTitles()).toEqual(['арбуз', 'яблоко']);
  });

  it('снапшот задач при смене сортировки не переписывается', async () => {
    const storage: FakeStorage = createFakeStorage({ stored: [task('яблоко', NOW)] });

    await renderWithStore(<ListTab />, { storage });
    await userEvent.selectOptions(sortSelect(), 'quadrant');

    expect(storage.saved).toEqual([]);
  });
});
