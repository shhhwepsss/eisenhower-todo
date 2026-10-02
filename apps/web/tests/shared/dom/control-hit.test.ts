import { hitsControl } from '@/shared/dom/control-hit';

/**
 * Общий ответ на «попали в контрол?» (issue #40, фаза 1).
 *
 * До этой фазы ответ был написан дважды — в `ui/task/TaskRow` и
 * `ui/matrix/children/SortableCard` — и копии разъехались на `label`. Тест
 * держит сам помощник, а поведение его вызывающих сторон проверяют
 * `tests/ui/matrix/drag-start.test.tsx` и `tests/ui/list/ListTab.test.tsx`:
 * инвариант фазы — `BEHAVIOR_PRESERVED`, и ловится он там, а не здесь.
 *
 * Чтобы упасть, третьему тесту нужно, чтобы помощник смотрел на сам `target`
 * вместо `closest` — именно так он сломался бы на `<svg>` внутри кнопки.
 */

const render = (html: string): HTMLElement => {
  document.body.innerHTML = html;
  return document.body;
};

describe('hitsControl', () => {
  it('видит контрол, когда нажали прямо по нему', () => {
    const root: HTMLElement = render('<button type="button">Срочная</button>');
    const button: HTMLElement = root.querySelector('button') as HTMLElement;

    expect(hitsControl(button)).toBe(true);
  });

  it('видит контрол, когда нажали по тому, что внутри него', () => {
    const root: HTMLElement = render('<button type="button"><svg><circle /></svg></button>');
    const glyph: Element = root.querySelector('circle') as Element;

    expect(hitsControl(glyph)).toBe(true);
  });

  it('не видит контрола там, где его нет', () => {
    const root: HTMLElement = render('<article><h3>Купить молоко</h3></article>');
    const heading: HTMLElement = root.querySelector('h3') as HTMLElement;

    expect(hitsControl(heading)).toBe(false);
  });

  it('считает контролом `label`: клик по подписи браузер отдаёт её полю', () => {
    const root: HTMLElement = render('<label>Тема<select><option>Тёмная</option></select></label>');
    const label: HTMLElement = root.querySelector('label') as HTMLElement;

    expect(hitsControl(label)).toBe(true);
  });

  it('переживает цель, которая элементом не является', () => {
    expect(hitsControl(null)).toBe(false);
    expect(hitsControl(document)).toBe(false);
  });
});
