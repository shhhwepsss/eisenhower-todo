import type { Task } from '@/domain';
import { TaskCard } from '@/ui/task';
import type { ZoneMeta } from '../constants';
import styles from './MatrixZone.module.scss';

type MatrixZoneProps = {
  meta: ZoneMeta;
  tasks: Task[];
};

/**
 * Одна зона матрицы: «Входящие» или квадрант. Обе устроены одинаково —
 * заголовок, подпись и список карточек, — потому что различаются только тем,
 * откуда взялись задачи и можно ли их переставлять.
 *
 * Число задач в заголовке — то, ради чего пользователь и смотрит на матрицу
 * (PRD S3): переполненный Q1 при пустом Q2 виден сразу, без отчётов.
 */
export const MatrixZone = ({ meta, tasks }: MatrixZoneProps) => {
  return (
    <section className={styles.zone} aria-label={meta.title}>
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
              <TaskCard task={task} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
