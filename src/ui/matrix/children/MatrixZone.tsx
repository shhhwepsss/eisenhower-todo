import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, Zone } from '@/domain';
import { zoneDroppableId } from '../helpers';
import type { ZoneMeta } from '../constants';
import { SortableCard } from './SortableCard';
import styles from './MatrixZone.module.scss';

type MatrixZoneProps = {
  zone: Zone;
  meta: ZoneMeta;
  tasks: Task[];
};

/**
 * Одна зона матрицы: «Входящие» или квадрант. Обе устроены одинаково —
 * заголовок, подпись и список карточек, — потому что различаются только тем,
 * откуда взялись задачи и что означает их порядок.
 *
 * Зона принимает бросок сама, а не только её карточки: в пустой квадрант иначе
 * нельзя было бы попасть вовсе, а именно с пустого квадранта разбор и начинается.
 *
 * Число задач в заголовке — то, ради чего пользователь и смотрит на матрицу
 * (PRD S3): переполненный Q1 при пустом Q2 виден сразу, без отчётов.
 */
export const MatrixZone = ({ zone, meta, tasks }: MatrixZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: zoneDroppableId(zone) });
  const ids: string[] = tasks.map((task) => task.id);

  return (
    <section
      ref={setNodeRef}
      className={isOver ? `${styles.zone} ${styles.over}` : styles.zone}
      aria-label={meta.title}
    >
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
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className={styles.list}>
            {tasks.map((task) => (
              <SortableCard key={task.id} task={task} />
            ))}
          </ul>
        </SortableContext>
      )}
    </section>
  );
};
