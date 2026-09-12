import { resolveZone } from '@/domain';
import type { Zone } from '@/domain';
import { PriorityToggles } from './children/PriorityToggles';
import { StatusSelect } from './children/StatusSelect';
import type { TaskCardProps } from './types';
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
 *
 * Ручка стоит слева от заголовка, а не обнимает карточку целиком (часть 2):
 * на карточке живут переключатели разбора, и жест за всю карточку спорил бы
 * с нажатием на них.
 */
export const TaskCard = ({ task, handle }: TaskCardProps) => {
  const zone: Zone = resolveZone(task);

  return (
    <article className={styles.card} data-zone={zone} aria-label={task.title}>
      <div className={styles.head}>
        {handle}
        <h3 className={styles.title}>{task.title}</h3>
      </div>
      <div className={styles.controls}>
        <StatusSelect task={task} />
        <PriorityToggles task={task} />
      </div>
    </article>
  );
};
