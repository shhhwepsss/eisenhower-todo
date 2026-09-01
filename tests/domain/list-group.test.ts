import { getTasksListGroup, isTaskLive } from '@/domain';
import type { ListGroup, Task } from '@/domain';

import { allTaskVariants, makeTask } from './fixtures';

describe('getTasksListGroup', () => {
  it('завершённая задача уходит в «Готово» независимо от разбора', () => {
    expect(getTasksListGroup(makeTask({ status: 'done', assigned: false }))).toBe('done');
    expect(getTasksListGroup(makeTask({ status: 'done', assigned: true, urgent: true }))).toBe('done');
  });

  it('разобранная незавершённая — в «Разобранные»', () => {
    expect(getTasksListGroup(makeTask({ status: 'in_progress', assigned: true }))).toBe('assigned');
  });

  it('неразобранная незавершённая — во «Входящие»', () => {
    expect(getTasksListGroup(makeTask({ status: 'todo', assigned: false }))).toBe('inbox');
  });
});

describe('LIST_PARTITION', () => {
  const live: Task[] = allTaskVariants().filter(isTaskLive);

  it('три группы не пересекаются и в объединении дают все живые задачи', () => {
    const groups: Record<ListGroup, string[]> = { inbox: [], assigned: [], done: [] };
    for (const task of live) groups[getTasksListGroup(task)].push(task.id);

    const union: string[] = [...groups.inbox, ...groups.assigned, ...groups.done];
    expect(new Set(union).size).toBe(union.length);
    expect(union.length).toBe(live.length);
  });

  it('LIST_IS_COMPLETE: список не фильтрует ничего, кроме надгробий', () => {
    const all: Task[] = allTaskVariants();

    expect(live.length).toBe(all.filter((task) => task.deletedAt === null).length);
  });
});
