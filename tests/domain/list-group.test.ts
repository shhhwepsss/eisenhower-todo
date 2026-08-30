import { isLive, listGroupOf } from '@/domain';
import type { ListGroup } from '@/domain';

import { allTaskVariants, makeTask } from './fixtures';

describe('listGroupOf', () => {
  it('завершённая задача уходит в «Готово» независимо от разбора', () => {
    expect(listGroupOf(makeTask({ status: 'done', assigned: false }))).toBe('done');
    expect(listGroupOf(makeTask({ status: 'done', assigned: true, urgent: true }))).toBe('done');
  });

  it('разобранная незавершённая — в «Разобранные»', () => {
    expect(listGroupOf(makeTask({ status: 'in_progress', assigned: true }))).toBe('assigned');
  });

  it('неразобранная незавершённая — во «Входящие»', () => {
    expect(listGroupOf(makeTask({ status: 'todo', assigned: false }))).toBe('inbox');
  });
});

describe('LIST_PARTITION', () => {
  const live = allTaskVariants().filter(isLive);

  it('три группы не пересекаются и в объединении дают все живые задачи', () => {
    const groups: Record<ListGroup, string[]> = { inbox: [], assigned: [], done: [] };
    for (const task of live) groups[listGroupOf(task)].push(task.id);

    const union = [...groups.inbox, ...groups.assigned, ...groups.done];
    expect(new Set(union).size).toBe(union.length);
    expect(union.length).toBe(live.length);
  });

  it('LIST_IS_COMPLETE: список не фильтрует ничего, кроме надгробий', () => {
    const all = allTaskVariants();

    expect(live.length).toBe(all.filter((task) => task.deletedAt === null).length);
  });
});
