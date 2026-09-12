import { createTask } from '@/domain';
import type { Task } from '@/domain';
import type { MatrixZones } from '@/state';
import { findDraggedTask } from '@/ui/matrix/helpers';

/**
 * Задача под копией карточки в `DragOverlay` (issue #38, DRAG_IS_VISIBLE).
 * Оверлею известен только `active.id`, и найти по нему задачу — единственное,
 * что от помощника требуется.
 */

const task = (id: string): Task => createTask({ id, title: id, now: '2026-01-01T10:00:00.000Z' });

const zones = (patch: Partial<MatrixZones> = {}): MatrixZones => {
  return { inbox: [], Q1: [], Q2: [], Q3: [], Q4: [], ...patch };
};

describe('findDraggedTask', () => {
  it('находит задачу в любой зоне, а не только во «Входящих»', () => {
    const target: Task = task('в третьем квадранте');

    expect(findDraggedTask(zones({ Q3: [target] }), 'в третьем квадранте')).toBe(target);
  });

  it('без жеста показывать нечего', () => {
    expect(findDraggedTask(zones({ inbox: [task('лежит')] }), null)).toBeNull();
  });

  it('задача, которой в матрице уже нет, даёт null, а не исключение', () => {
    expect(findDraggedTask(zones({ Q1: [task('осталась')] }), 'удалили в другой вкладке')).toBeNull();
  });
});
