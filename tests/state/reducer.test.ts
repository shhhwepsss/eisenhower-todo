import { DEFAULT_UI_SETTINGS, resolveZone } from '@/domain';
import type { Task, Zone } from '@/domain';
import { reducer } from '@/state/reducer';
import type { Action, AppState } from '@/state/types';

/**
 * Редьюсер проверяется вызовом функции: ни React, ни хранилища, ни фейковых
 * таймеров здесь нет — это и есть REDUCER_IS_PURE в наблюдаемой форме
 * (docs/specs/4-architecture.md §5).
 */

const NOW: string = '2026-01-01T10:00:00.000Z';
const LATER: string = '2026-01-02T10:00:00.000Z';

const emptyState = (): AppState => {
  return { tasks: [], ui: DEFAULT_UI_SETTINGS, storage: 'ready' };
};

const added = (id: string, title: string, now: string = NOW): Action => {
  return { type: 'task/added', id, title, text: '', now };
};

const stateWithTask = (id: string, title: string = 'написать спеку'): AppState => {
  const state: AppState = emptyState();
  const action: Action = added(id, title);
  return reducer(state, action);
};

const taskOf = (state: AppState, id: string): Task => {
  const task: Task | undefined = state.tasks.find((candidate) => candidate.id === id);
  if (task === undefined) throw new Error(`задачи ${id} нет в состоянии`);
  return task;
};

describe('REDUCER_IS_PURE', () => {
  it('один и тот же state и action дают идентичный результат', () => {
    const state: AppState = emptyState();
    const action: Action = added('task-1', 'написать спеку');

    const first: AppState = reducer(state, action);
    const second: AppState = reducer(state, action);

    expect(first).toEqual(second);
  });

  it('не трогает переданное состояние: массив задач остаётся прежним', () => {
    const state: AppState = emptyState();

    reducer(state, added('task-1', 'написать спеку'));

    expect(state.tasks).toEqual([]);
  });
});

describe('task/added', () => {
  it('кладёт в состояние неразобранную задачу — MANUAL_PRIORITISATION', () => {
    const state: AppState = stateWithTask('task-1');
    const task: Task = taskOf(state, 'task-1');
    const zone: Zone = resolveZone(task);

    expect(task.assigned).toBe(false);
    expect(task.status).toBe('todo');
    expect(zone).toBe('inbox');
  });

  it('время создания приходит из действия, а не из часов', () => {
    const state: AppState = stateWithTask('task-1');
    const task: Task = taskOf(state, 'task-1');

    expect(task.createdAt).toBe(NOW);
  });
});

describe('правки текста', () => {
  it('меняет заголовок и двигает updatedAt', () => {
    const before: AppState = stateWithTask('task-1');

    const after: AppState = reducer(before, {
      type: 'task/title-edited',
      id: 'task-1',
      title: 'написать спеку и показать',
      now: LATER,
    });

    const task: Task = taskOf(after, 'task-1');

    expect(task.title).toBe('написать спеку и показать');
    expect(task.updatedAt).toBe(LATER);
  });

  it('меняет текст и двигает updatedAt', () => {
    const before: AppState = stateWithTask('task-1');

    const after: AppState = reducer(before, {
      type: 'task/text-edited',
      id: 'task-1',
      text: 'скоуп, инварианты, критерии',
      now: LATER,
    });

    const task: Task = taskOf(after, 'task-1');

    expect(task.text).toBe('скоуп, инварианты, критерии');
    expect(task.updatedAt).toBe(LATER);
  });

  it('правка тем же значением возвращает то же состояние: no-op не рождает объект', () => {
    const before: AppState = stateWithTask('task-1');

    const after: AppState = reducer(before, {
      type: 'task/title-edited',
      id: 'task-1',
      title: 'написать спеку',
      now: LATER,
    });

    expect(after).toBe(before);
  });
});

describe('разбор и перенос', () => {
  const assign = (state: AppState, id: string, to: Zone): AppState => {
    return reducer(state, {
      type: 'task/moved',
      id,
      to,
      between: { before: null, after: null },
      now: LATER,
    });
  };

  it('переносит задачу в квадрант по соседям из действия', () => {
    const before: AppState = stateWithTask('task-1');

    const after: AppState = assign(before, 'task-1', 'Q1');
    const task: Task = taskOf(after, 'task-1');

    expect(resolveZone(task)).toBe('Q1');
  });

  it('разбор переключателями ставит те же признаки, что и перенос', () => {
    const before: AppState = stateWithTask('task-1');

    const after: AppState = reducer(before, {
      type: 'task/priority-set',
      id: 'task-1',
      priority: { assigned: true, urgent: false, important: true },
      between: { before: null, after: null },
      now: LATER,
    });

    const task: Task = taskOf(after, 'task-1');

    expect(resolveZone(task)).toBe('Q2');
  });

  it('повторный перенос в ту же зону на то же место — no-op (идемпотентность, §10)', () => {
    const created: AppState = stateWithTask('task-1');
    const assigned: AppState = assign(created, 'task-1', 'Q1');

    const again: AppState = assign(assigned, 'task-1', 'Q1');

    expect(again).toBe(assigned);
  });

  it('повторный setStatus с тем же статусом — no-op (идемпотентность, §10)', () => {
    const created: AppState = stateWithTask('task-1');
    const assigned: AppState = assign(created, 'task-1', 'Q1');
    const done: AppState = reducer(assigned, {
      type: 'task/status-set',
      id: 'task-1',
      status: 'done',
      between: { before: null, after: null },
      now: LATER,
    });

    const again: AppState = reducer(done, {
      type: 'task/status-set',
      id: 'task-1',
      status: 'done',
      between: { before: null, after: null },
      now: LATER,
    });

    expect(again).toBe(done);
  });

  it('PRIORITY_SURVIVES_DONE: завершение и возврат оставляют задачу в её квадранте', () => {
    const created: AppState = stateWithTask('task-1');
    const assigned: AppState = assign(created, 'task-1', 'Q3');

    const done: AppState = reducer(assigned, {
      type: 'task/status-set',
      id: 'task-1',
      status: 'done',
      between: { before: null, after: null },
      now: LATER,
    });
    const back: AppState = reducer(done, {
      type: 'task/status-set',
      id: 'task-1',
      status: 'todo',
      between: { before: null, after: null },
      now: LATER,
    });

    const doneTask: Task = taskOf(done, 'task-1');
    const backTask: Task = taskOf(back, 'task-1');

    expect(doneTask.assigned).toBe(true);
    expect(resolveZone(backTask)).toBe('Q3');
  });
});

describe('task/deleted', () => {
  it('DELETE_IS_A_TOMBSTONE: запись остаётся в состоянии с датой удаления', () => {
    const before: AppState = stateWithTask('task-1');

    const after: AppState = reducer(before, { type: 'task/deleted', id: 'task-1', now: LATER });

    const task: Task = taskOf(after, 'task-1');

    expect(after.tasks).toHaveLength(1);
    expect(task.deletedAt).toBe(LATER);
  });

  it('повторное удаление — no-op', () => {
    const created: AppState = stateWithTask('task-1');
    const deleted: AppState = reducer(created, {
      type: 'task/deleted',
      id: 'task-1',
      now: LATER,
    });

    const again: AppState = reducer(deleted, { type: 'task/deleted', id: 'task-1', now: LATER });

    expect(again).toBe(deleted);
  });
});

describe('действие про неизвестную задачу', () => {
  it('оставляет состояние тем же', () => {
    const before: AppState = stateWithTask('task-1');

    const after: AppState = reducer(before, { type: 'task/deleted', id: 'task-404', now: LATER });

    expect(after).toBe(before);
  });
});
