import { useSortable } from '@dnd-kit/sortable';
import type { MouseEvent, PointerEvent, ReactNode } from 'react';
import type { Task } from '@/domain';
import { hitsControl } from '@/shared/dom/control-hit';
import { TaskCard } from '@/ui/task';
import { DragGrip } from './DragGrip';
import styles from './SortableCard.module.scss';

type SortableCardProps = {
  task: Task;
  /** Клик по карточке — открыть окно правки этой задачи (issue #40). */
  onOpen: (id: string) => void;
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
export const SortableCard = ({ task, onOpen }: SortableCardProps) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useSortable({
    id: task.id,
  });

  /**
   * Карточка тянется целиком, но не в ущерб контролам: нажатие на них до жеста
   * не доходит. Отбор нужен, потому что `PointerSensor` его не делает — его
   * активатор смотрит только на `isPrimary` и `button` (`@dnd-kit/core`,
   * `PointerSensor.activators`). Пока слушатель висел на ручке, это было
   * неважно; теперь он висит на всей карточке, и контролы оказались под ним.
   *
   * Сама ручка под отбор тоже попадает — она кнопка, — и это правильно: жест
   * с неё начинает её собственный обработчик, а не этот.
   *
   * `transform` карточке не ставится — пока указатель едет, за ним летит
   * `DragPreview` в `DragOverlay` (`MatrixTab`), а исходная карточка остаётся
   * на месте приглушённой.
   */
  const onPointerDown = (event: PointerEvent<HTMLLIElement>): void => {
    if (hitsControl(event.target)) return;
    listeners?.onPointerDown?.(event);
  };

  /**
   * Нажатие без движения открывает окно правки (issue #40). Тот же отбор
   * контролов, что и у жеста: клик по статусу меняет статус и окно не трогает
   * (CONTROLS_KEEP_THEIR_PRESS).
   *
   * Отличать клик от жеста здесь нечем и не нужно: как только порог в 4px
   * пройден, `@dnd-kit` сам вешает на документ capture-слушатель `click`
   * со `stopPropagation` (`@dnd-kit/core`, `AbstractPointerSensor.handleStart`),
   * и клик после перетаскивания сюда не доходит — DRAG_STILL_WORKS.
   */
  const onClick = (event: MouseEvent<HTMLLIElement>): void => {
    if (hitsControl(event.target)) return;
    onOpen(task.id);
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
      onClick={onClick}
    >
      <TaskCard task={task} handle={handle} />
    </li>
  );
};
