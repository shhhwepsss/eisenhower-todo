import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
 */
export const SortableCard = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <li
      ref={setNodeRef}
      className={isDragging ? `${styles.item} ${styles.dragging}` : styles.item}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        type="button"
        className={styles.handle}
        aria-label={`Перетащить «${task.title}»`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <TaskCard task={task} />
    </li>
  );
};
