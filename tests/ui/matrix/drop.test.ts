import { createTask } from '@/domain';
import type { Task } from '@/domain';
import type { MatrixZones } from '@/state';
import { resolveDrop, zoneDroppableId } from '@/ui/matrix/helpers';
import type { DropTarget } from '@/ui/matrix/helpers';

/**
 * Куда попадёт брошенная задача. Функция чистая, поэтому проверяется вызовом:
 * ни DOM, ни `@dnd-kit`, ни жеста мышью здесь нет — есть состояние матрицы
 * и два идентификатора.
 */

const NOW: string = '2026-01-01T10:00:00.000Z';

const task = (id: string, rank: string, patch: Partial<Task> = {}): Task => {
  const created: Task = createTask({ id, title: id, now: NOW });
  return { ...created, rank, ...patch };
};

const assigned: Partial<Task> = { assigned: true, urgent: true, important: true };

const emptyZones = (): MatrixZones => ({ inbox: [], Q1: [], Q2: [], Q3: [], Q4: [] });

const first: Task = task('первая', 'a1', assigned);
const second: Task = task('вторая', 'a2', assigned);
const third: Task = task('третья', 'a3', assigned);

const q1WithThree = (): MatrixZones => ({ ...emptyZones(), Q1: [first, second, third] });

const requireTarget = (target: DropTarget | null): DropTarget => {
  if (target === null) throw new Error('бросок не разобран');
  return target;
};

describe('бросок на зону', () => {
  it('в пустой квадрант: задача одна, соседей нет', () => {
    const inbox: Task = task('неразобранная', 'a1');
    const zones: MatrixZones = { ...emptyZones(), inbox: [inbox] };

    const target: DropTarget = requireTarget(
      resolveDrop(zones, inbox.id, zoneDroppableId('Q2')),
    );

    expect(target.zone).toBe('Q2');
    expect(target.between).toEqual({ before: null, after: null });
  });

  it('в непустой квадрант: задача встаёт в конец', () => {
    const inbox: Task = task('неразобранная', 'a1');
    const zones: MatrixZones = { ...q1WithThree(), inbox: [inbox] };

    const target: DropTarget = requireTarget(
      resolveDrop(zones, inbox.id, zoneDroppableId('Q1')),
    );

    expect(target.between).toEqual({ before: third, after: null });
  });

  it('возврат во «Входящие» — зона-приёмник inbox', () => {
    const target: DropTarget = requireTarget(
      resolveDrop(q1WithThree(), first.id, zoneDroppableId('inbox')),
    );

    expect(target.zone).toBe('inbox');
  });
});

describe('бросок на карточку внутри квадранта', () => {
  it('снизу вверх: задача встаёт перед целью', () => {
    const target: DropTarget = requireTarget(resolveDrop(q1WithThree(), third.id, first.id));

    expect(target.zone).toBe('Q1');
    expect(target.between).toEqual({ before: null, after: first });
  });

  it('сверху вниз: задача встаёт после цели', () => {
    const target: DropTarget = requireTarget(resolveDrop(q1WithThree(), first.id, third.id));

    expect(target.between).toEqual({ before: third, after: null });
  });

  it('в середину: соседями становятся карточки по обе стороны', () => {
    const target: DropTarget = requireTarget(resolveDrop(q1WithThree(), first.id, second.id));

    expect(target.between).toEqual({ before: second, after: third });
  });

  it('на самого себя: перемещения нет — жест без намерения', () => {
    expect(resolveDrop(q1WithThree(), second.id, second.id)).toBeNull();
  });
});

describe('бросок между зонами', () => {
  it('RANK_IS_QUADRANT_LOCAL: соседи берутся в квадранте-приёмнике', () => {
    const inbox: Task = task('неразобранная', 'a1');
    const zones: MatrixZones = { ...q1WithThree(), inbox: [inbox] };

    const target: DropTarget = requireTarget(resolveDrop(zones, inbox.id, second.id));

    expect(target.zone).toBe('Q1');
    expect(target.between).toEqual({ before: first, after: second });
  });
});

describe('бросок в никуда', () => {
  it('неизвестная цель не даёт перемещения', () => {
    expect(resolveDrop(q1WithThree(), first.id, 'кто-то-посторонний')).toBeNull();
  });
});
