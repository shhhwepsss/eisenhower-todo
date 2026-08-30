import {
  isInMatrix,
  placementOf,
  placementOfPriority,
  priorityOf,
  priorityOfPlacement,
  samePlacement,
} from '@/domain';
import type { Placement, Quadrant } from '@/domain';

import { allTaskVariants, makeTask } from './fixtures';

const QUADRANTS: readonly Quadrant[] = ['Q1', 'Q2', 'Q3', 'Q4'];

function zoneKey(placement: Placement): string {
  return placement.zone === 'inbox' ? 'inbox' : placement.quadrant;
}

describe('placementOf', () => {
  it('неразобранная задача попадает во «Входящие»', () => {
    expect(placementOf(makeTask({ assigned: false }))).toEqual({ zone: 'inbox' });
  });

  it('признаки неразобранной задачи не читаются: зона всё равно «Входящие»', () => {
    const task = makeTask({ assigned: false, urgent: true, important: true });

    expect(placementOf(task)).toEqual({ zone: 'inbox' });
    expect(priorityOf(task)).toEqual({ assigned: false });
  });

  it.each([
    { urgent: true, important: true, quadrant: 'Q1' },
    { urgent: false, important: true, quadrant: 'Q2' },
    { urgent: true, important: false, quadrant: 'Q3' },
    { urgent: false, important: false, quadrant: 'Q4' },
  ])('разобранная $urgent/$important → $quadrant', ({ urgent, important, quadrant }) => {
    const task = makeTask({ assigned: true, urgent, important });

    expect(placementOf(task)).toEqual({ zone: 'quadrant', quadrant });
  });

  it('Q4 отличим от «Входящих»: та же пара признаков, разные зоны', () => {
    const inbox = makeTask({ assigned: false, urgent: false, important: false });
    const q4 = makeTask({ assigned: true, urgent: false, important: false });

    expect(placementOf(inbox)).not.toEqual(placementOf(q4));
  });
});

describe('соответствие «квадрант ↔ признаки»', () => {
  it.each(QUADRANTS)('%s переживает круговой обход через Priority', (quadrant) => {
    const placement: Placement = { zone: 'quadrant', quadrant };

    expect(placementOfPriority(priorityOfPlacement(placement))).toEqual(placement);
  });

  it('«Входящие» переживают круговой обход', () => {
    expect(placementOfPriority(priorityOfPlacement({ zone: 'inbox' }))).toEqual({ zone: 'inbox' });
  });

  it('признаки квадранта совпадают с тем, что читается с задачи', () => {
    for (const quadrant of QUADRANTS) {
      const priority = priorityOfPlacement({ zone: 'quadrant', quadrant });
      const task = makeTask({
        assigned: true,
        urgent: priority.assigned && priority.urgent,
        important: priority.assigned && priority.important,
      });

      expect(priorityOf(task)).toEqual(priority);
    }
  });
});

describe('samePlacement', () => {
  it('различает квадранты между собой и «Входящие» от квадранта', () => {
    expect(samePlacement({ zone: 'inbox' }, { zone: 'inbox' })).toBe(true);
    expect(samePlacement({ zone: 'quadrant', quadrant: 'Q1' }, { zone: 'quadrant', quadrant: 'Q1' })).toBe(true);
    expect(samePlacement({ zone: 'quadrant', quadrant: 'Q1' }, { zone: 'quadrant', quadrant: 'Q3' })).toBe(false);
    expect(samePlacement({ zone: 'inbox' }, { zone: 'quadrant', quadrant: 'Q4' })).toBe(false);
  });
});

describe('MATRIX_PARTITION', () => {
  const variants = allTaskVariants();

  it('зоны матрицы покрывают все видимые задачи и не пересекаются', () => {
    const visible = variants.filter(isInMatrix);
    const byZone = new Map<string, number>();

    for (const task of visible) {
      const key = zoneKey(placementOf(task));
      byZone.set(key, (byZone.get(key) ?? 0) + 1);
    }

    const total = [...byZone.values()].reduce((sum, count) => sum + count, 0);
    expect(total).toBe(visible.length);
    expect([...byZone.keys()].sort()).toEqual(['Q1', 'Q2', 'Q3', 'Q4', 'inbox']);
  });

  it('DONE_LEAVES_MATRIX: завершённых и удалённых задач в матрице нет', () => {
    const visible = variants.filter(isInMatrix);

    expect(visible.every((task) => task.status !== 'done')).toBe(true);
    expect(visible.every((task) => task.deletedAt === null)).toBe(true);
    expect(visible).toHaveLength(variants.filter((t) => t.status !== 'done' && t.deletedAt === null).length);
  });
});
