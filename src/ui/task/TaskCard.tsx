import { resolveZone } from '@/domain';
import type { Zone } from '@/domain';
import { StatusSelect } from './children/StatusSelect';
import type { TaskCardProps } from './types';
import styles from './TaskCard.module.scss';

/**
 * Карточка задачи на вкладке «Матрица» — экран текущей работы, поэтому здесь
 * только заголовок и статус: то, что отвечает на вопрос «что и в какой стадии»,
 * не открывая задачу.
 *
 * Переключатели признаков отсюда ушли в окно правки (issue #40, ONE_EDIT_SURFACE):
 * ручная правка живёт в одном месте, а быстрый путь между квадрантами — это
 * перетаскивание, оно и осталось на карточке. Статус остался, потому что он
 * не правка задачи, а отметка хода работы, и прятать его за окном значило бы
 * прятать состояние.
 *
 * Имя карточке даёт заголовок задачи, а её контрол называется коротко —
 * «Статус»: одинаковых контролов на экране много, и различает их та карточка,
 * внутри которой они лежат.
 *
 * Полоса слева красится в цвет зоны (docs/specs/35-design-system.md §3):
 * задача уже лежит внутри своего квадранта, здесь цвет — подтверждение,
 * а не единственный носитель смысла.
 *
 * Ручка стоит слева от заголовка (часть 2). Тянется при этом карточка целиком
 * (issue #38), а ручка держит клавиатурный путь жеста.
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
      </div>
    </article>
  );
};
