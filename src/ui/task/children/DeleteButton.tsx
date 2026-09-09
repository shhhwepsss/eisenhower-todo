import { useTaskActions } from '@/state';
import type { TaskActions } from '@/state';
import type { TaskProps } from '../types';
import styles from './DeleteButton.module.scss';

/**
 * Удаление без переспроса: подтверждающий диалог здесь стоил бы больше, чем
 * спасал. Запись при этом никуда не девается — остаётся надгробием
 * (DELETE_IS_A_TOMBSTONE), просто перестаёт попадать в выборки.
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
      Удалить
    </button>
  );
};
