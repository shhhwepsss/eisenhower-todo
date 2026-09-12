import { useTaskActions } from '@/state';
import type { TaskActions } from '@/state';
import type { TaskProps } from '../types';
import styles from './DeleteButton.module.scss';

/**
 * Удаление без переспроса: подтверждающий диалог здесь стоил бы больше, чем
 * спасал. Запись при этом никуда не девается — остаётся надгробием
 * (DELETE_IS_A_TOMBSTONE), просто перестаёт попадать в выборки.
 *
 * Значок вместо подписи (часть 2): строка стала компактной, а имя кнопке даёт
 * `aria-label` — голосом она по-прежнему называется «Удалить».
 */
export const DeleteButton = ({ task }: TaskProps) => {
  const { deleteTask }: TaskActions = useTaskActions();

  return (
    <button
      className={styles.button}
      type="button"
      aria-label="Удалить"
      onClick={() => deleteTask(task.id)}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" />
      </svg>
    </button>
  );
};
