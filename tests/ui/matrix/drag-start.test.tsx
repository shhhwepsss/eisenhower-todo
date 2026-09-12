import { fireEvent, screen, within } from '@testing-library/react';

import { createTask } from '@/domain';
import { MatrixTab } from '@/ui/matrix';
import { renderWithStore } from '../../support/store';

/**
 * Откуда жест начинается, а откуда нет (issue #38, WHOLE_CARD_DRAGS).
 *
 * Проверяется наблюдаемый признак начатого жеста — атрибут `data-dragging` на
 * `body` (`shared/hooks/use-body-dragging`), а не внутренности `@dnd-kit`.
 * Раскладки в jsdom нет, поэтому дальше захвата тест не идёт: куда задача
 * приедет — вопрос геометрии, и он закрывается прогоном в браузере.
 *
 * Чтобы упасть, первому тесту нужно, чтобы слушатель снова уехал на одну ручку;
 * второму — чтобы `hitsControl` перестал отсеивать контролы. Оба следят за
 * разными половинами одного решения, поэтому нужны оба.
 *
 * Контрол на карточке теперь один — выбор статуса: признаки разбора уехали
 * в окно правки (issue #40), и проверять на них отбор больше негде.
 */

const NOW: string = '2026-01-01T10:00:00.000Z';

const card = (title: string): HTMLElement => screen.getByRole('article', { name: title });

/**
 * Порог захвата — 4 пикселя (`MatrixTab`), поэтому одного `pointerdown` мало:
 * жест начинается на движении. Координаты задаются событием, так что нулевые
 * прямоугольники jsdom здесь не мешают.
 */
const grabAndMove = (from: HTMLElement): void => {
  fireEvent.pointerDown(from, { isPrimary: true, button: 0, clientX: 0, clientY: 0 });
  fireEvent.pointerMove(document, { isPrimary: true, clientX: 40, clientY: 0 });
};

const isDragging = (): boolean => document.body.getAttribute('data-dragging') === 'true';

describe('захват карточки', () => {
  it('жест начинается с любого места карточки, а не только с ручки', async () => {
    await renderWithStore(<MatrixTab />, { stored: [createTask({ id: 'a', title: 'разобрать', now: NOW })] });

    grabAndMove(within(card('разобрать')).getByRole('heading', { name: 'разобрать' }));

    expect(isDragging()).toBe(true);
  });

  it('нажатие на выбор статуса жест не начинает', async () => {
    await renderWithStore(<MatrixTab />, { stored: [createTask({ id: 'a', title: 'разобрать', now: NOW })] });

    grabAndMove(within(card('разобрать')).getByRole('combobox', { name: 'Статус' }));

    expect(isDragging()).toBe(false);
  });
});
