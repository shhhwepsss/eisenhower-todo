import * as mutations from '@/domain/mutations';
import {
  deleteTask,
  editText,
  editTitle,
  endOf,
  isTaskLive,
  moveToZone,
  rankBetween,
  resolveZone,
  setPriority,
  setStatus,
} from '@/domain';
import type { Neighbours, Task } from '@/domain';

import { LATER, makeTask, ranked } from './fixtures';

const NOWHERE: Neighbours = { before: null, after: null };

/** Признаки разбора — тройка, которую PRIORITY_SURVIVES_DONE обязана сохранять. */
const priorityFields = (task: Task) => {
  return { assigned: task.assigned, urgent: task.urgent, important: task.important };
};

describe('editTitle', () => {
  it('меняет заголовок и ставит updatedAt', () => {
    const task: Task = makeTask();
    const edited: Task = editTitle(task, '  новый заголовок  ', LATER);

    expect(edited.title).toBe('новый заголовок');
    expect(edited.updatedAt).toBe(LATER);
    expect(edited.createdAt).toBe(task.createdAt);
  });

  it('тот же заголовок — та же задача, updatedAt не двигается', () => {
    const task: Task = makeTask({ title: 'задача' });

    expect(editTitle(task, '  задача  ', LATER)).toBe(task);
  });

  it('пустой заголовок — ошибка', () => {
    expect(() => editTitle(makeTask(), '   ', LATER)).toThrow(/TITLE_IS_NOT_EMPTY/);
  });
});

describe('editText', () => {
  it('меняет описание и ставит updatedAt', () => {
    const edited: Task = editText(makeTask(), '  подробности  ', LATER);

    expect(edited.text).toBe('подробности');
    expect(edited.updatedAt).toBe(LATER);
  });

  it('описание можно стереть: пустое — валидное состояние', () => {
    const task: Task = makeTask({ text: 'было описание' });
    const cleared: Task = editText(task, '   ', LATER);

    expect(cleared.text).toBe('');
    expect(cleared.updatedAt).toBe(LATER);
  });

  it('то же описание — та же задача', () => {
    const task: Task = makeTask({ text: 'подробности' });

    expect(editText(task, 'подробности', LATER)).toBe(task);
  });
});

describe('setStatus', () => {
  it('меняет статус и ставит updatedAt', () => {
    const task: Task = makeTask({ status: 'todo' });
    const started: Task = setStatus(task, 'in_progress', NOWHERE, LATER);

    expect(started.status).toBe('in_progress');
    expect(started.updatedAt).toBe(LATER);
  });

  it('тот же статус — та же задача', () => {
    const task: Task = makeTask({ status: 'done' });

    expect(setStatus(task, 'done', NOWHERE, LATER)).toBe(task);
  });

  it('MANUAL_PRIORITISATION: признаки разбора статус не трогает', () => {
    const task: Task = ranked('t', 'a1');

    expect(priorityFields(setStatus(task, 'done', NOWHERE, LATER))).toEqual(priorityFields(task));
  });

  it('PRIORITY_SURVIVES_DONE: todo → done → todo возвращает в тот же квадрант', () => {
    const task: Task = ranked('t', 'a1');
    const done: Task = setStatus(task, 'done', NOWHERE, LATER);
    const back: Task = setStatus(done, 'todo', NOWHERE, LATER);

    expect(resolveZone(back)).toBe(resolveZone(task));
    expect(priorityFields(back)).toEqual(priorityFields(task));
  });

  it('возврат из done ставит задачу в конец её прежнего квадранта (PRD §3)', () => {
    const done: Task = ranked('t', 'a1', { status: 'done' });
    const last: Task = ranked('last', 'a5');

    const back: Task = setStatus(done, 'todo', endOf([last]), LATER);

    expect(back.rank).toBe(rankBetween({ before: last, after: null }));
    expect(back.rank > last.rank).toBe(true);
  });

  it('уход в done ранг не трогает', () => {
    const task: Task = ranked('t', 'a1');

    expect(setStatus(task, 'done', endOf([ranked('last', 'a5')]), LATER).rank).toBe('a1');
  });

  it('возврат из done у неразобранной задачи ранг не трогает: во «Входящих» он не нужен', () => {
    const done: Task = makeTask({ assigned: false, status: 'done', rank: 'a0' });

    expect(setStatus(done, 'todo', endOf([ranked('last', 'a5')]), LATER).rank).toBe('a0');
  });
});

describe('setPriority', () => {
  it('разбор переключателями ставит задачу в конец квадранта-приёмника', () => {
    const task: Task = makeTask({ assigned: false });
    const last: Task = ranked('last', 'a5');

    const assigned: Task = setPriority(
      task,
      { assigned: true, urgent: true, important: true },
      endOf([last]),
      LATER,
    );

    expect(resolveZone(assigned)).toBe('Q1');
    expect(assigned.rank).toBe(rankBetween({ before: last, after: null }));
    expect(assigned.updatedAt).toBe(LATER);
  });

  it('снятие разбора нормализует признаки в false', () => {
    const task: Task = ranked('t', 'a1');
    const unassigned: Task = setPriority(task, { assigned: false }, NOWHERE, LATER);

    expect(priorityFields(unassigned)).toEqual({
      assigned: false,
      urgent: false,
      important: false,
    });
    expect(resolveZone(unassigned)).toBe('inbox');
  });

  it('RANK_IS_QUADRANT_LOCAL: смена квадранта генерирует ранг по соседям приёмника', () => {
    const task: Task = ranked('t', 'a1');
    const lastInQ3: Task = ranked('q3-last', 'a5', { urgent: true, important: false });

    const moved: Task = setPriority(
      task,
      { assigned: true, urgent: true, important: false },
      endOf([lastInQ3]),
      LATER,
    );

    expect(resolveZone(moved)).toBe('Q3');
    expect(moved.rank).not.toBe(task.rank);
    expect(moved.rank).toBe(rankBetween({ before: lastInQ3, after: null }));
  });

  it('идемпотентность: тот же разбор и то же место — та же задача', () => {
    const before: Task = ranked('a', 'a0');
    const task: Task = ranked('t', 'a1');
    const after: Task = ranked('c', 'a2');

    expect(
      setPriority(task, { assigned: true, urgent: true, important: true }, { before, after }, LATER),
    ).toBe(task);
  });

  it('идемпотентность во «Входящих»: повтор снятия разбора ничего не меняет', () => {
    const task: Task = makeTask({ assigned: false });

    expect(setPriority(task, { assigned: false }, NOWHERE, LATER)).toBe(task);
  });
});

describe('moveToZone', () => {
  it('бросок в середину: ранг встаёт между соседями', () => {
    const a: Task = ranked('a', 'a0');
    const b: Task = ranked('b', 'a1');
    const task: Task = makeTask({ assigned: false });

    const dropped: Task = moveToZone(task, 'Q1', { before: a, after: b }, LATER);

    expect(dropped.rank).toBe('a0V');
    expect(resolveZone(dropped)).toBe('Q1');
  });

  it('бросок на собственное место — та же задача: ни ранга, ни updatedAt', () => {
    const a: Task = ranked('a', 'a0');
    const task: Task = ranked('t', 'a1');
    const c: Task = ranked('c', 'a2');

    expect(moveToZone(task, 'Q1', { before: a, after: c }, LATER)).toBe(task);
  });

  it('бросок в тот же квадрант, но на другое место — новый ранг', () => {
    const a: Task = ranked('a', 'a0');
    const b: Task = ranked('b', 'a1');
    const task: Task = ranked('t', 'a2');

    const moved: Task = moveToZone(task, 'Q1', { before: a, after: b }, LATER);

    expect(moved.rank).toBe('a0V');
    expect(moved.updatedAt).toBe(LATER);
  });

  it('возврат во «Входящие» снимает разбор и ранг не трогает', () => {
    const task: Task = ranked('t', 'a1');
    const returned: Task = moveToZone(task, 'inbox', endOf([ranked('last', 'a5')]), LATER);

    expect(resolveZone(returned)).toBe('inbox');
    expect(returned.rank).toBe('a1');
    expect(returned.updatedAt).toBe(LATER);
  });
});

describe('deleteTask', () => {
  it('DELETE_IS_A_TOMBSTONE: ставит надгробие, запись остаётся', () => {
    const task: Task = makeTask();
    const deleted: Task = deleteTask(task, LATER);
    const snapshot: Task[] = [deleted];

    expect(deleted.deletedAt).toBe(LATER);
    expect(deleted.updatedAt).toBe(LATER);
    expect(isTaskLive(deleted)).toBe(false);
    expect(snapshot).toHaveLength(1);
    expect(snapshot.filter(isTaskLive)).toHaveLength(0);
  });

  it('повторное удаление — no-op, надгробие не переписывается', () => {
    const deleted: Task = deleteTask(makeTask(), LATER);

    expect(deleteTask(deleted, '2027-01-01T00:00:00.000Z')).toBe(deleted);
  });
});

/**
 * TIMESTAMPS_MONOTONIC_PER_TASK держится двумя вещами: приватной `touch` внутри
 * mutations.ts и этой таблицей.
 *
 * Тип `Record<keyof typeof mutations, ...>` требует строку на каждый экспорт —
 * новая мутация без строки не скомпилируется. Сверка ключей ниже ловит обратное:
 * строку, оставшуюся от удалённой мутации. Поэтому «забыли обновить updatedAt
 * в новой функции» перестаёт быть возможным незаметно.
 */
const CHANGES: Record<keyof typeof mutations, (task: Task) => Task> = {
  editTitle: (task) => editTitle(task, 'другой заголовок', LATER),
  editText: (task) => editText(task, 'другое описание', LATER),
  setStatus: (task) => setStatus(task, 'done', NOWHERE, LATER),
  setPriority: (task) => setPriority(task, { assigned: false }, NOWHERE, LATER),
  moveToZone: (task) => moveToZone(task, 'Q2', NOWHERE, LATER),
  deleteTask: (task) => deleteTask(task, LATER),
};

describe('TIMESTAMPS_MONOTONIC_PER_TASK', () => {
  it('таблица покрывает ровно экспорты mutations.ts, без пропусков и хвостов', () => {
    expect(Object.keys(CHANGES).sort()).toEqual(Object.keys(mutations).sort());
  });

  it('каждая мутация, которой есть что менять, ставит updatedAt и не трогает createdAt', () => {
    for (const [name, apply] of Object.entries(CHANGES)) {
      const task: Task = ranked('t', 'a1');
      const result: Task = apply(task);

      expect(result, name).not.toBe(task);
      expect(result.updatedAt, name).toBe(LATER);
      expect(result.createdAt, name).toBe(task.createdAt);
      expect(result.id, name).toBe(task.id);
    }
  });
});
