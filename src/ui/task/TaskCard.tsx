import { resolveZone } from '@/domain';
import type { Zone } from '@/domain';
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
 *
 * Полоса слева красится в цвет зоны (docs/specs/35-design-system.md §3):
 * задача уже лежит внутри своего квадранта, здесь цвет — подтверждение,
 * а не единственный носитель смысла.
 */
export const TaskCard = ({ task }: TaskProps) => {
  const zone: Zone = resolveZone(task);

  return (
    <article className={styles.card} data-zone={zone} aria-label={task.title}>
      <h3 className={styles.title}>{task.title}</h3>
      <StatusSelect task={task} />
      <PriorityToggles task={task} />
    </article>
  );
};
