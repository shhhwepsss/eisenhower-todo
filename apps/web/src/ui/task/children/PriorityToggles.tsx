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
 *
 * Не `input[type=checkbox]`, а кнопка с `aria-pressed` (часть 2): включённый
 * признак показывается инверсной заливкой, и одна заливка смысл не несёт —
 * то же состояние читается голосом как «нажато» (COLOR_NOT_ALONE). Галочка
 * рядом с подписью съедала бы место, которого в компактной строке нет.
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
      <button
        type="button"
        className={urgent ? `${styles.toggle} ${styles.toggleOn}` : styles.toggle}
        aria-pressed={urgent}
        onClick={() => assign({ urgent: !urgent, important })}
      >
        Срочная
      </button>
      <button
        type="button"
        className={important ? `${styles.toggle} ${styles.toggleOn}` : styles.toggle}
        aria-pressed={important}
        onClick={() => assign({ urgent, important: !important })}
      >
        Важная
      </button>
    </div>
  );
};
