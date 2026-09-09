import { DeleteButton } from './children/DeleteButton';
import { EditableText } from './children/EditableText';
import { EditableTitle } from './children/EditableTitle';
import { PriorityToggles } from './children/PriorityToggles';
import { StatusSelect } from './children/StatusSelect';
import type { TaskProps } from './types';
import styles from './TaskRow.module.scss';

/**
 * Строка задачи на вкладке «Список». В отличие от карточки матрицы, здесь задача
 * доступна целиком: список — инвентарь, и всё, что с задачей можно сделать,
 * делается отсюда (PRD §6).
 *
 * Имя строке даёт заголовок задачи, а её контролы называются коротко —
 * различает их та строка, внутри которой они лежат.
 */
export const TaskRow = ({ task }: TaskProps) => {
  return (
    <article className={styles.row} aria-label={task.title}>
      <EditableTitle task={task} />
      <EditableText task={task} />
      <div className={styles.controls}>
        <StatusSelect task={task} />
        <PriorityToggles task={task} />
        <DeleteButton task={task} />
      </div>
    </article>
  );
};
