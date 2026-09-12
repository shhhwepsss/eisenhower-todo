import { useTaskActions } from '@/state';
import type { TaskActions } from '@/state';
import type { TaskProps } from '../types';
import styles from './PriorityToggles.module.scss';

/**
 * Разбор задачи переключателями — второй способ назначить квадрант (PRD §3).
 * Способы эквивалентны: квадрант остаётся следствием пары признаков.
 *
 * Любое переключение делает задачу разобранной, и снять разбор здесь нельзя —
 * решение ревью архитектуры (спека §12, решение 1): вернуть задачу во «Входящие»
 * можно только явным перетаскиванием, отдельного контрола «снять разбор» в MVP нет.
 * Поэтому снятые оба флажка — это Q4 («ни то ни другое»), а не «Входящие»:
 * Q4 — результат разбора, а неразобранность — его отсутствие.
 */
export const PriorityToggles = ({ task }: TaskProps) => {
  const { setPriority }: TaskActions = useTaskActions();

  const urgent: boolean = task.assigned && task.urgent;
  const important: boolean = task.assigned && task.important;

  const assign = (flags: { urgent: boolean; important: boolean }): void => {
    setPriority(task.id, { assigned: true, urgent: flags.urgent, important: flags.important });
  };

  return (
    <div className={styles.toggles}>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={urgent}
          onChange={(event) => assign({ urgent: event.target.checked, important })}
        />
        Срочная
      </label>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={important}
          onChange={(event) => assign({ urgent, important: event.target.checked })}
        />
        Важная
      </label>
    </div>
  );
};
