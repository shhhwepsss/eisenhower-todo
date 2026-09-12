import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';
import type { Task } from '@/domain';
import { TaskCard } from '@/ui/task';
import styles from './SortableCard.module.scss';

/**
 * Карточка, которую можно перетащить. Обёртка живёт в слайсе матрицы, а не
 * в `ui/task`: перетаскивание есть только здесь, и знать о нём строке списка
 * незачем.
 *
 * Жест висит на отдельной ручке, а не на всей карточке. Иначе он перехватывал бы
 * нажатия на переключатели и на выбор статуса — а разбор переключателями и есть
 * второй, равноправный способ назначить квадрант (PRD §3).
 *
 * Ручка уезжает внутрь карточки, слева от заголовка (часть 2): снаружи она
 * висела отдельным столбиком и читалась как чужой элемент, а не как часть
 * карточки, которую тянут.
 */
export const SortableCard = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const handle: ReactNode = (
    <button
      type="button"
      className={styles.handle}
      aria-label={`Перетащить «${task.title}»`}
      {...attributes}
      {...listeners}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
        <circle cx="9" cy="6" r="1.6" />
        <circle cx="15" cy="6" r="1.6" />
        <circle cx="9" cy="12" r="1.6" />
        <circle cx="15" cy="12" r="1.6" />
        <circle cx="9" cy="18" r="1.6" />
        <circle cx="15" cy="18" r="1.6" />
      </svg>
    </button>
  );

  return (
    <li
      ref={setNodeRef}
      className={isDragging ? `${styles.item} ${styles.dragging}` : styles.item}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <TaskCard task={task} handle={handle} />
    </li>
  );
};
