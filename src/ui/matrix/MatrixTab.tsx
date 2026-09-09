import { QUADRANTS } from '@/domain';
import type { Task } from '@/domain';
import { useInboxTasks } from '@/state';
import { QuadrantZone } from './children/QuadrantZone';
import { MatrixZone } from './children/MatrixZone';
import { INBOX_META } from './constants';
import styles from './MatrixTab.module.scss';

/**
 * Рабочий экран (PRD §3): «Входящие» стоят рядом с квадрантами, чтобы разбор был
 * одним движением. Выполненные задачи здесь не видны нигде, включая «Входящие», —
 * DONE_LEAVES_MATRIX держится выборками в `state/`, а не фильтром в разметке.
 *
 * Список квадрантов берётся из домена, а не выписывается здесь: порядок Q1..Q4
 * задан одной таблицей на весь проект.
 */
export const MatrixTab = () => {
  const inbox: Task[] = useInboxTasks();

  return (
    <section
      className={styles.panel}
      role="tabpanel"
      id="panel-matrix"
      aria-labelledby="tab-matrix"
    >
      <div className={styles.board}>
        <MatrixZone meta={INBOX_META} tasks={inbox} />
        <div className={styles.quadrants}>
          {QUADRANTS.map((quadrant) => (
            <QuadrantZone key={quadrant} quadrant={quadrant} />
          ))}
        </div>
      </div>
    </section>
  );
};
