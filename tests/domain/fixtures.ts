import { createTask } from '@/domain';
import type { Task } from '@/domain';

export const NOW = '2026-01-01T00:00:00.000Z';

export function makeTask(overrides: Partial<Task> = {}): Task {
  return { ...createTask({ id: 'task-1', title: 'задача', now: NOW }), ...overrides };
}

/** Задача в квадранте Q1 с заданным рангом — материал для тестов порядка. */
export function ranked(id: string, rank: string, overrides: Partial<Task> = {}): Task {
  return makeTask({ id, rank, assigned: true, urgent: true, important: true, ...overrides });
}
