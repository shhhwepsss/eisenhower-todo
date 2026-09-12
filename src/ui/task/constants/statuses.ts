import type { TaskStatus } from '@/domain';

/**
 * Подписи статусов и их порядок в переключателе (PRD §3: todo → in progress → done).
 *
 * Список выводится из таблицы, а не выписывается вторым литералом: добавленный
 * статус иначе пришлось бы вписать в двух местах.
 */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  done: 'Выполнена',
};

export const STATUSES: readonly TaskStatus[] = Object.keys(STATUS_LABELS) as TaskStatus[];
