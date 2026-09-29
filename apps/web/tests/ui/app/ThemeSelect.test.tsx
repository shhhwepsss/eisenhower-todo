import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { App } from '@/ui/app';
import { createFakeStorage, renderWithStore } from '../../support/store';
import type { FakeStorage } from '../../support/store';

/**
 * Переключатель темы (docs/specs/35-design-system.md §4). Атрибут ставится на
 * `<html>`, а не на `body` — там живёт `data-dragging` (§5), и путать их незачем.
 */
const themeSelect = (): HTMLElement => screen.getByRole('combobox', { name: /Тема/ });

describe('переключатель темы', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('«системная» не ставит атрибут — решает медиазапрос', async () => {
    await renderWithStore(<App />);

    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });

  it('выбор тёмной темы ставит data-theme="dark" на <html>', async () => {
    await renderWithStore(<App />);

    await userEvent.selectOptions(themeSelect(), 'dark');

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('возврат к «системной» снимает атрибут', async () => {
    await renderWithStore(<App />);

    await userEvent.selectOptions(themeSelect(), 'light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    await userEvent.selectOptions(themeSelect(), 'system');
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });

  it('выбор переживает перемонтирование приложения', async () => {
    const storage: FakeStorage = createFakeStorage();

    await renderWithStore(<App />, { storage });
    await userEvent.selectOptions(themeSelect(), 'dark');

    cleanup();
    await renderWithStore(<App />, { storage });

    expect(themeSelect()).toHaveValue('dark');
  });
});
