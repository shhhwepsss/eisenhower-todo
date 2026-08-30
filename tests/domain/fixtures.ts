import { createTask, placementOfZone, priorityOfPlacement } from '@/domain';
import type { Task, TaskStatus, Zone } from '@/domain';

export const NOW = '2026-01-01T00:00:00.000Z';
export const LATER = '2026-02-02T12:00:00.000Z';

export const ZONES: readonly Zone[] = ['inbox', 'Q1', 'Q2', 'Q3', 'Q4'];

export function makeTask(overrides: Partial<Task> = {}): Task {
  return { ...createTask({ id: 'task-1', title: 'задача', now: NOW }), ...overrides };
}

/** Задача в квадранте Q1 с заданным рангом — материал для тестов порядка. */
export function ranked(id: string, rank: string, overrides: Partial<Task> = {}): Task {
  return makeTask({ id, rank, assigned: true, urgent: true, important: true, ...overrides });
}

/** Задача, лежащая в названной зоне. Признаки выводятся из зоны, а не задаются руками. */
export function inZone(zone: Zone, rank: string, overrides: Partial<Task> = {}): Task {
  const priority = priorityOfPlacement(placementOfZone(zone));
  return makeTask({
    id: `task-${zone}-${rank}`,
    rank,
    assigned: priority.assigned,
    urgent: priority.assigned && priority.urgent,
    important: priority.assigned && priority.important,
    ...overrides,
  });
}

const STATUSES: readonly TaskStatus[] = ['todo', 'in_progress', 'done'];
const FLAGS: readonly boolean[] = [false, true];

/**
 * Все 48 состояний задачи: разбор × срочность × важность × статус × надгробие.
 *
 * Пространство конечное и маленькое, поэтому свойства проверяются исчерпывающим
 * перебором, а не случайной генерацией: перебор сильнее и не требует библиотеки.
 */
export function allTaskVariants(): Task[] {
  const tasks: Task[] = [];
  for (const assigned of FLAGS) {
    for (const urgent of FLAGS) {
      for (const important of FLAGS) {
        for (const status of STATUSES) {
          for (const deleted of FLAGS) {
            tasks.push(
              makeTask({
                id: `task-${tasks.length}`,
                assigned,
                urgent,
                important,
                status,
                deletedAt: deleted ? LATER : null,
              }),
            );
          }
        }
      }
    }
  }
  return tasks;
}
