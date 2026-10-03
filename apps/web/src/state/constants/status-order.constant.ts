import type { TaskStatus } from '@eisenhower/core';

/** Порядок статусов — рабочий: сначала то, что в работе, потом сделанное. */
export const STATUS_ORDER: Record<TaskStatus, number> = { in_progress: 0, todo: 1, done: 2 };
