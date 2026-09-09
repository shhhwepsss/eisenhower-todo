import type { Task } from '@/domain';
import { useListGroup } from '@/state';
import { TaskRow } from '@/ui/task';
import type { GroupMeta } from '../constants';
import styles from './ListGroupSection.module.scss';

/**
 * Одна группа списка. Выборку группа читает сама — тогда добавление группы это
 * строка в таблице `LIST_GROUPS`, а не ещё один проброс через пропсы.
 *
 * Группа показывается всегда, даже пустая: три группы — это разбиение
 * (LIST_PARTITION), и пропавшая с экрана группа читалась бы как «задач такого
 * рода не бывает», а не как «их сейчас нет».
 */
export const ListGroupSection = ({ meta }: { meta: GroupMeta }) => {
  const tasks: Task[] = useListGroup(meta.id);

  return (
    <section className={styles.group} aria-label={meta.title}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          {meta.title}
          <span className={styles.count}>{tasks.length}</span>
        </h2>
        <p className={styles.hint}>{meta.hint}</p>
      </header>

      {tasks.length === 0 ? (
        <p className={styles.empty}>{meta.empty}</p>
      ) : (
        <ul className={styles.list}>
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskRow task={task} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
