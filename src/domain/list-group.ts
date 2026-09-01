import type { ListGroup, Task } from './types';

/**
 * В какой из трёх групп вкладки «Список» показывается задача — LIST_PARTITION
 * (PRD §3: «Входящие», «В квадранте», «Выполненные»; спека §9).
 *
 * Порядок проверок и есть правило: завершённая задача уходит в «Выполненные»
 * независимо от разбора, поэтому PRIORITY_SURVIVES_DONE группу не ломает.
 */
export const getTasksListGroup = (task: Task): ListGroup => {
  if (task.status === 'done') return 'done';
  return task.assigned ? 'assigned' : 'inbox';
};
