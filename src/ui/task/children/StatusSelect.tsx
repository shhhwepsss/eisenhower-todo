import type { TaskStatus } from '@/domain';
import { useTaskActions } from '@/state';
import type { TaskActions } from '@/state';
import { STATUSES, STATUS_LABELS } from '../constants';
import type { TaskProps } from '../types';
import styles from './StatusSelect.module.scss';

/**
 * Статус задачи — три состояния, переходы в любом направлении (PRD §3).
 *
 * Приведение значения `select` к `TaskStatus` безопасно: варианты собраны из той же
 * таблицы `STATUS_LABELS`, других значений в разметке нет. Проверить это компилятором
 * нечем — `HTMLSelectElement.value` по определению строка.
 */
export const StatusSelect = ({ task }: TaskProps) => {
  const { setStatus }: TaskActions = useTaskActions();

  return (
    <select
      className={styles.select}
      value={task.status}
      aria-label={`Статус задачи «${task.title}»`}
      onChange={(event) => setStatus(task.id, event.target.value as TaskStatus)}
    >
      {STATUSES.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
};
