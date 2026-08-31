import {
  isTaskInMatrix,
  QUADRANTS,
  resolvePriority,
  resolvePriorityByZone,
  resolveZone,
  resolveZoneByPriority,
} from '@/domain';
import type { Priority, Quadrant, Task, Zone } from '@/domain';

import { allTaskVariants, makeTask } from './fixtures';

/**
 * Список квадрантов, выписанный независимо от кода (PRD §2). Импортировать
 * `QUADRANTS` сюда нельзя: тест ходил бы по тому же списку, что и код, и не
 * заметил бы пропавший квадрант. Сверка двух списков — тест ниже.
 */
const ALL_QUADRANTS: readonly Quadrant[] = ['Q1', 'Q2', 'Q3', 'Q4'];

describe('resolveZone', () => {
  it('неразобранная задача попадает во «Входящие»', () => {
    expect(resolveZone(makeTask({ assigned: false }))).toBe('inbox');
  });

  it('признаки неразобранной задачи не читаются: зона всё равно «Входящие»', () => {
    const task: Task = makeTask({ assigned: false, urgent: true, important: true });

    expect(resolveZone(task)).toBe('inbox');
    expect(resolvePriority(task)).toEqual({ assigned: false });
  });

  it.each([
    { urgent: true, important: true, quadrant: 'Q1' },
    { urgent: false, important: true, quadrant: 'Q2' },
    { urgent: true, important: false, quadrant: 'Q3' },
    { urgent: false, important: false, quadrant: 'Q4' },
  ])('разобранная $urgent/$important → $quadrant', ({ urgent, important, quadrant }) => {
    const task: Task = makeTask({ assigned: true, urgent, important });

    expect(resolveZone(task)).toBe(quadrant);
  });

  it('Q4 отличим от «Входящих»: та же пара признаков, разные зоны', () => {
    const inbox: Task = makeTask({ assigned: false, urgent: false, important: false });
    const q4: Task = makeTask({ assigned: true, urgent: false, important: false });

    expect(resolveZone(inbox)).not.toBe(resolveZone(q4));
  });
});

describe('QUADRANTS', () => {
  it('выведенный из таблицы список совпадает с независимым перечислением', () => {
    expect([...QUADRANTS].sort()).toEqual([...ALL_QUADRANTS].sort());
  });
});

describe('соответствие «квадрант ↔ признаки»', () => {
  it.each(ALL_QUADRANTS)('%s переживает круговой обход через Priority', (quadrant) => {
    const priority: Priority = resolvePriorityByZone(quadrant);

    expect(resolveZoneByPriority(priority)).toBe(quadrant);
  });

  it('«Входящие» переживают круговой обход', () => {
    const priority: Priority = resolvePriorityByZone('inbox');

    expect(resolveZoneByPriority(priority)).toBe('inbox');
  });

  it('признаки квадранта совпадают с тем, что читается с задачи', () => {
    for (const quadrant of ALL_QUADRANTS) {
      const priority: Priority = resolvePriorityByZone(quadrant);
      const task: Task = makeTask({
        assigned: true,
        urgent: priority.assigned && priority.urgent,
        important: priority.assigned && priority.important,
      });

      expect(resolvePriority(task)).toEqual(priority);
    }
  });
});

describe('MATRIX_PARTITION', () => {
  const variants: Task[] = allTaskVariants();

  it('зоны матрицы покрывают все видимые задачи и не пересекаются', () => {
    const visible: Task[] = variants.filter(isTaskInMatrix);
    const byZone: Map<Zone, number> = new Map<Zone, number>();

    for (const task of visible) {
      const zone: Zone = resolveZone(task);
      byZone.set(zone, (byZone.get(zone) ?? 0) + 1);
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
