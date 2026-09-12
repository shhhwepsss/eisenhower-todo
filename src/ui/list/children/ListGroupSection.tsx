import type { Task } from '@/domain';
import { useListGroup } from '@/state';
import { TaskRow } from '@/ui/task';
import type { GroupMeta } from '../constants';
import styles from './ListGroupSection.module.scss';

type ListGroupSectionProps = {
  meta: GroupMeta;
  /** Клик по строке — открыть окно правки её задачи (issue #40). */
  onOpen: (id: string) => void;
};

/**
 * Одна группа списка. Выборку группа читает сама — тогда добавление группы это
 * строка в таблице `LIST_GROUPS`, а не ещё один проброс через пропсы.
 *
 * Группа показывается всегда, даже пустая: три группы — это разбиение
 * (LIST_PARTITION), и пропавшая с экрана группа читалась бы как «задач такого
 * рода не бывает», а не как «их сейчас нет».
 *
 * Группа — карточка-поверхность (часть 2): заголовок со счётчиком-пилюлей
 * и подсказкой под ним, строки лежат внутри отдельными плитками. Тень в тёмной
 * теме `none` (`--shadow-raised`), и карточку там отделяет граница.
 */
export const ListGroupSection = ({ meta, onOpen }: ListGroupSectionProps) => {
  const tasks: Task[] = useListGroup(meta.id);

  return (
    <section className={styles.group} aria-label={meta.title}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2 className={styles.title}>{meta.title}</h2>
          <span className={styles.count}>{tasks.length}</span>
        </div>
        <p className={styles.hint}>{meta.hint}</p>
      </header>

      {tasks.length === 0 ? (
        <p className={styles.empty}>{meta.empty}</p>
      ) : (
        <ul className={styles.list}>
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskRow task={task} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
