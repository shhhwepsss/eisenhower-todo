import { useSortable } from '@dnd-kit/sortable';
import type { PointerEvent, ReactNode } from 'react';
import type { Task } from '@/domain';
import { TaskCard } from '@/ui/task';
import { DragGrip } from './DragGrip';
import styles from './SortableCard.module.scss';

/**
 * Элементы, с которых жест начинаться не должен: у них есть собственное
 * нажатие, и отдать его перетаскиванию значит сломать контрол. Сегодня на
 * карточке это `<select>` статуса и две кнопки разбора (`ui/task/TaskCard`),
 * плюс сама ручка — она активирует жест своим обработчиком, а не этим.
 *
 * Отбор нужен, потому что `PointerSensor` его не делает: его активатор смотрит
 * только на `isPrimary` и `button` (`@dnd-kit/core`, `PointerSensor.activators`).
 * Пока слушатель висел на ручке, это было неважно — теперь он висит на всей
 * карточке, и контролы оказались под ним.
 *
 * Список описывает род элементов, а не инвентарь карточки: `input`, `label`,
 * `textarea` и `a` на карточке пока не встречаются, но правило «у контрола своё
 * нажатие» от этого не меняется, и добавленный контрол не должен ждать правки
 * здесь, чтобы заработать.
 */
const CARD_CONTROLS: string = 'button, select, input, label, textarea, a';

const isFromControl = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false;
  return target.closest(CARD_CONTROLS) !== null;
};

/**
 * Карточка, которую можно перетащить. Обёртка живёт в слайсе матрицы, а не
 * в `ui/task`: перетаскивание есть только здесь, и знать о нём строке списка
 * незачем.
 *
 * Ручка уезжает внутрь карточки, слева от заголовка (часть 2): снаружи она
 * висела отдельным столбиком и читалась как чужой элемент, а не как часть
 * карточки, которую тянут.
 *
 * Жест берётся за всю карточку, а не только за ручку (issue #38, WHOLE_CARD_DRAGS):
 * карточка выглядит одним объектом, и ручка 20×20 px — единственное место, за
 * которое её можно было взять, — этому виду противоречила. Слушатели указателя
 * висят на `<li>`, потому что карточка занимает его целиком, а сама `TaskCard`
 * про `@dnd-kit` ничего не знает и знать не должна.
 *
 * Ручка при этом остаётся: она держит `attributes` и клавиатурный путь. Жест
 * с клавиатуры — единственный способ вернуть задачу во «Входящие» без мыши
 * (спека #35 §12), и он требует элемента, который можно сфокусировать.
 */
export const SortableCard = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useSortable({
    id: task.id,
  });

  /**
   * Карточка тянется целиком, но не в ущерб контролам: нажатие на них до жеста
   * не доходит. `transform` карточке не ставится — пока указатель едет, за ним
   * летит `DragPreview` в `DragOverlay` (`MatrixTab`), а исходная карточка
   * остаётся на месте приглушённой.
   */
  const onPointerDown = (event: PointerEvent<HTMLLIElement>): void => {
    if (isFromControl(event.target)) return;
    listeners?.onPointerDown?.(event);
  };

  const handle: ReactNode = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      className={styles.handle}
      aria-label={`Перетащить «${task.title}»`}
      {...attributes}
      {...listeners}
    >
      <DragGrip />
    </button>
  );

  return (
    <li
      ref={setNodeRef}
      className={isDragging ? `${styles.item} ${styles.dragging}` : styles.item}
      onPointerDown={onPointerDown}
    >
      <TaskCard task={task} handle={handle} />
    </li>
  );
};
