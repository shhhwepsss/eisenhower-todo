import { compareTasks, endOf, isBetween, rankBetween, sortByRank } from '@/domain';
import type { Task } from '@/domain';

import { ranked } from './fixtures';

describe('rankBetween', () => {
  it('пустой квадрант даёт первый ключ', () => {
    expect(rankBetween({ before: null, after: null })).toBe('a0');
  });

  it('вставка в начало даёт ключ меньше первого', () => {
    const first: Task = ranked('a', 'a0');
    const rank: string = rankBetween({ before: null, after: first });

    expect(rank < first.rank).toBe(true);
  });

  it('вставка в конец даёт ключ больше последнего', () => {
    const last: Task = ranked('c', 'a2');
    const rank: string = rankBetween({ before: last, after: null });

    expect(rank > last.rank).toBe(true);
  });

  it('вставка в середину: меняется одна запись, соседи не тронуты (спека §1)', () => {
    const a: Task = ranked('a', 'a0');
    const b: Task = ranked('b', 'a1');
    const c: Task = ranked('c', 'a2');
    const quadrant: Task[] = [a, b, c];

    const d: Task = ranked('d', rankBetween({ before: a, after: b }));

    expect(d.rank).toBe('a0V');
    expect(sortByRank([...quadrant, d]).map((task) => task.id)).toEqual(['a', 'd', 'b', 'c']);
    expect(quadrant).toEqual([a, b, c]);
    expect(quadrant.map((task) => task.updatedAt)).toEqual([a.updatedAt, b.updatedAt, c.updatedAt]);
  });

  it('щель между соседями не кончается: между «a0» и «a0V» есть ключ', () => {
    const a: Task = ranked('a', 'a0');
    const d: Task = ranked('d', 'a0V');
    const e: string = rankBetween({ before: a, after: d });

    expect(a.rank < e && e < d.rank).toBe(true);
  });
});

describe('RANK_TOTAL_ORDER', () => {
  it('одинаковые ранги упорядочены по id', () => {
    const x: Task = ranked('x', 'a0');
    const y: Task = ranked('y', 'a0');

    expect(compareTasks(x, y)).toBeLessThan(0);
    expect(compareTasks(y, x)).toBeGreaterThan(0);
    expect(compareTasks(x, x)).toBe(0);
  });

  it('порядок не зависит от порядка задач во входном массиве', () => {
    const tasks: Task[] = [ranked('y', 'a0'), ranked('b', 'a1'), ranked('x', 'a0')];
    const expected: string[] = ['x', 'y', 'b'];

    expect(sortByRank(tasks).map((task) => task.id)).toEqual(expected);
    expect(sortByRank([...tasks].reverse()).map((task) => task.id)).toEqual(expected);
  });

  it('sortByRank не мутирует вход', () => {
    const tasks: Task[] = [ranked('b', 'a1'), ranked('a', 'a0')];
    sortByRank(tasks);

    expect(tasks.map((task) => task.id)).toEqual(['b', 'a']);
  });
});

describe('isBetween', () => {
  const a: Task = ranked('a', 'a0');
  const b: Task = ranked('b', 'a1');
  const c: Task = ranked('c', 'a2');

  it('задача на своём месте стоит между своими соседями', () => {
    expect(isBetween(b, { before: a, after: c })).toBe(true);
  });

  it('края квадранта выражаются через null', () => {
    expect(isBetween(a, { before: null, after: b })).toBe(true);
    expect(isBetween(c, { before: b, after: null })).toBe(true);
    expect(isBetween(a, { before: null, after: null })).toBe(true);
  });

  it('задача вне промежутка соседей — не между ними', () => {
    expect(isBetween(a, { before: b, after: c })).toBe(false);
    expect(isBetween(c, { before: a, after: b })).toBe(false);
  });
});

describe('endOf', () => {
  it('пустой квадрант — оба соседа null', () => {
    expect(endOf([])).toEqual({ before: null, after: null });
  });

  it('последний по рангу, а не по позиции во входном массиве', () => {
    const a: Task = ranked('a', 'a0');
    const c: Task = ranked('c', 'a2');

    expect(endOf([c, a])).toEqual({ before: c, after: null });
  });
});
