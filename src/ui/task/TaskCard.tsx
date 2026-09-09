import { PriorityToggles } from './children/PriorityToggles';
import { StatusSelect } from './children/StatusSelect';
import type { TaskProps } from './types';
import styles from './TaskCard.module.scss';

/**
 * Карточка задачи на вкладке «Матрица» — экран текущей работы, поэтому здесь
 * только то, что нужно для разбора и для отметки прогресса: заголовок, статус
 * и пара переключателей. Правка текста и удаление живут в списке (PRD §3).
 *
 * Имя карточке даёт заголовок задачи, а её контролы называются коротко —
 * «Статус», «Срочная»: одинаковых кнопок на экране много, и различает их
 * та карточка, внутри которой они лежат.
 */
export const TaskCard = ({ task }: TaskProps) => {
  return (
    <article className={styles.card} aria-label={task.title}>
      <h3 className={styles.title}>{task.title}</h3>
      <StatusSelect task={task} />
      <PriorityToggles task={task} />
    </article>
  );
};
