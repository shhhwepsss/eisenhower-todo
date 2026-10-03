import { CONTROL_SELECTOR } from '../constants/control-selector.constant';

/**
 * «Попали в контрол?» — один ответ на весь UI (issue #40).
 *
 * Вопрос возникает всюду, где родитель отвечает на нажатие: карточка матрицы
 * начинает жест (`ui/matrix/children/SortableCard`), строка списка раскрывается
 * (`ui/task/TaskRow`), а с модалкой задачи появится третье такое место. Раньше
 * ответ был написан дважды и копии уже разъехались на `label` — отсюда общий
 * помощник, а не третья копия.
 *
 * Живёт в `shared/`, а не в одном из слайсов: зовут его и `ui/matrix`,
 * и `ui/task`, а импортировать внутренности чужого слайса нельзя
 * (SLICE_PUBLIC_API, `eslint.config.js`).
 *
 * Смотрит `closest`, а не сам `target`: нажатие приходит на то, что под
 * указателем, — на `<svg>` внутри кнопки или на текст внутри `<label>`, — и
 * контролом является предок, а не оно само.
 *
 * `target` может оказаться не элементом (текстовый узел, `document`, `null`) —
 * такое попадание контролом не считается.
 */
export const hitsControl = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false;

  const control: Element | null = target.closest(CONTROL_SELECTOR);
  return control !== null;
};
