import {
  isSamePlacement,
  isTaskInMatrix,
  QUADRANTS,
  resolvePlacement,
  resolvePlacementByPriority,
  resolvePriority,
  resolvePriorityByPlacement,
} from '@/domain';
import type { Placement, Priority, Quadrant, Task } from '@/domain';

import { allTaskVariants, makeTask } from './fixtures';

/**
 * Список квадрантов, выписанный независимо от кода (PRD §2). Импортировать
 * `QUADRANTS` сюда нельзя: тест ходил бы по тому же списку, что и код, и не
 * заметил бы пропавший квадрант. Сверка двух списков — тест ниже.
 */
const ALL_QUADRANTS: readonly Quadrant[] = ['Q1', 'Q2', 'Q3', 'Q4'];

const zoneKey = (placement: Placement): string => {
  return placement.zone === 'inbox' ? 'inbox' : placement.quadrant;
};

describe('resolvePlacement', () => {
  it('неразобранная задача попадает во «Входящие»', () => {
    expect(resolvePlacement(makeTask({ assigned: false }))).toEqual({ zone: 'inbox' });
  });

  it('признаки неразобранной задачи не читаются: зона всё равно «Входящие»', () => {
    const task: Task = makeTask({ assigned: false, urgent: true, important: true });

    expect(resolvePlacement(task)).toEqual({ zone: 'inbox' });
    expect(resolvePriority(task)).toEqual({ assigned: false });
  });

  it.each([
    { urgent: true, important: true, quadrant: 'Q1' },
    { urgent: false, important: true, quadrant: 'Q2' },
    { urgent: true, important: false, quadrant: 'Q3' },
    { urgent: false, important: false, quadrant: 'Q4' },
  ])('разобранная $urgent/$important → $quadrant', ({ urgent, important, quadrant }) => {
    const task: Task = makeTask({ assigned: true, urgent, important });

    expect(resolvePlacement(task)).toEqual({ zone: 'quadrant', quadrant });
  });

  it('Q4 отличим от «Входящих»: та же пара признаков, разные зоны', () => {
    const inbox: Task = makeTask({ assigned: false, urgent: false, important: false });
    const q4: Task = makeTask({ assigned: true, urgent: false, important: false });

    expect(resolvePlacement(inbox)).not.toEqual(resolvePlacement(q4));
  });
});

describe('QUADRANTS', () => {
  it('выведенный из таблицы список совпадает с независимым перечислением', () => {
    expect([...QUADRANTS].sort()).toEqual([...ALL_QUADRANTS].sort());
  });
});

describe('соответствие «квадрант ↔ признаки»', () => {
  it.each(ALL_QUADRANTS)('%s переживает круговой обход через Priority', (quadrant) => {
    const placement: Placement = { zone: 'quadrant', quadrant };

    expect(resolvePlacementByPriority(resolvePriorityByPlacement(placement))).toEqual(placement);
  });

  it('«Входящие» переживают круговой обход', () => {
    expect(resolvePlacementByPriority(resolvePriorityByPlacement({ zone: 'inbox' }))).toEqual({ zone: 'inbox' });
  });

  it('признаки квадранта совпадают с тем, что читается с задачи', () => {
    for (const quadrant of ALL_QUADRANTS) {
      const priority: Priority = resolvePriorityByPlacement({ zone: 'quadrant', quadrant });
      const task: Task = makeTask({
        assigned: true,
        urgent: priority.assigned && priority.urgent,
        important: priority.assigned && priority.important,
      });

      expect(resolvePriority(task)).toEqual(priority);
    }
  });
});

describe('isSamePlacement', () => {
  it('различает квадранты между собой и «Входящие» от квадранта', () => {
    expect(isSamePlacement({ zone: 'inbox' }, { zone: 'inbox' })).toBe(true);
    expect(isSamePlacement({ zone: 'quadrant', quadrant: 'Q1' }, { zone: 'quadrant', quadrant: 'Q1' })).toBe(true);
    expect(isSamePlacement({ zone: 'quadrant', quadrant: 'Q1' }, { zone: 'quadrant', quadrant: 'Q3' })).toBe(false);
    expect(isSamePlacement({ zone: 'inbox' }, { zone: 'quadrant', quadrant: 'Q4' })).toBe(false);
  });
});

describe('MATRIX_PARTITION', () => {
  const variants: Task[] = allTaskVariants();

  it('зоны матрицы покрывают все видимые задачи и не пересекаются', () => {
    const visible: Task[] = variants.filter(isTaskInMatrix);
    const byZone: Map<string, number> = new Map<string, number>();

    for (const task of visible) {
      const key: string = zoneKey(resolvePlacement(task));
      byZone.set(key, (byZone.get(key) ?? 0) + 1);
    }

    const total: number = [...byZone.values()].reduce((sum, count) => sum + count, 0);
    expect(total).toBe(visible.length);
    expect([...byZone.keys()].sort()).toEqual(['Q1', 'Q2', 'Q3', 'Q4', 'inbox']);
  });

  it('DONE_LEAVES_MATRIX: завершённых и удалённых задач в матрице нет', () => {
    const visible: Task[] = variants.filter(isTaskInMatrix);

    expect(visible.every((task) => task.status !== 'done')).toBe(true);
    expect(visible.every((task) => task.deletedAt === null)).toBe(true);
    expect(visible).toHaveLength(variants.filter((t) => t.status !== 'done' && t.deletedAt === null).length);
  });
});
