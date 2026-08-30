import type { ListGroup, Task } from './types';

/**
 * Группа задачи во вкладке «Список» — LIST_PARTITION
 * (docs/specs/4-architecture.md §9).
 *
 * Группы упорядочены по приоритету проверки: завершённая задача уходит в `done`
 * независимо от разбора, поэтому `PRIORITY_SURVIVES_DONE` группу не ломает.
 */
export function listGroupOf(task: Task): ListGroup {
  if (task.status === 'done') return 'done';
  return task.assigned ? 'assigned' : 'inbox';
}
