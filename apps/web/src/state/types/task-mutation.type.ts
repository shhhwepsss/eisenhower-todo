import type { Task } from '@eisenhower/core';

/** Мутация задачи в терминах домена: задача плюс намерение — новая задача. */
export type TaskMutation = (task: Task) => Task;
