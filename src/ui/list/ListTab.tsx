import { ListGroupSection } from './children/ListGroupSection';
import { ListSortSelect } from './children/ListSortSelect';
import { TaskForm } from './children/TaskForm';
import { LIST_GROUPS } from './constants';
import styles from './ListTab.module.scss';

/**
 * Полный инвентарь задач (PRD §3): три группы в фиксированном порядке, внутри
 * групп — выбранная сортировка. Здесь видны все задачи без исключения, включая
 * выполненные, — LIST_IS_COMPLETE.
 */
export const ListTab = () => {
  return (
    <section className={styles.panel} role="tabpanel" id="panel-list" aria-labelledby="tab-list">
      <div className={styles.toolbar}>
        <TaskForm />
        <ListSortSelect />
      </div>

      <div className={styles.groups}>
        {LIST_GROUPS.map((meta) => (
          <ListGroupSection key={meta.id} meta={meta} />
        ))}
      </div>
    </section>
  );
};
