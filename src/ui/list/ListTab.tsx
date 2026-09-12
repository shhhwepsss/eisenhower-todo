import type { Task } from '@/domain';
import { useTask } from '@/state';
import { TaskDialog, useTaskDialog } from '@/ui/task';
import type { TaskDialogState } from '@/ui/task';
import { ListGroupSection } from './children/ListGroupSection';
import { ListSortSelect } from './children/ListSortSelect';
import { TaskForm } from './children/TaskForm';
import { LIST_GROUPS } from './constants';
import styles from './ListTab.module.scss';

/**
 * Полный инвентарь задач (PRD §3): три группы в фиксированном порядке, внутри
 * групп — выбранная сортировка. Здесь видны все задачи без исключения, включая
 * выполненные, — LIST_IS_COMPLETE.
 *
 * Окно правки задачи держит вкладка, а не строка (issue #40): «какая задача
 * открыта» — одно состояние на весь экран, и окно обязано быть одно. Это тот же
 * компонент, что показывает «Матрица» (MODAL_IS_SHARED).
 */
export const ListTab = () => {
  const dialog: TaskDialogState = useTaskDialog();
  const openTask: Task | null = useTask(dialog.openTaskId);

  return (
    <section className={styles.panel} role="tabpanel" id="panel-list" aria-labelledby="tab-list">
      <div className={styles.toolbar}>
        <TaskForm />
        <ListSortSelect />
      </div>

      <div className={styles.groups}>
        {LIST_GROUPS.map((meta) => (
          <ListGroupSection key={meta.id} meta={meta} onOpen={dialog.open} />
        ))}
      </div>

      <TaskDialog task={openTask} onClose={dialog.close} />
    </section>
  );
};
