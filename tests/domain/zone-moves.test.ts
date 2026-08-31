import { ZONE_MOVES, moveToZone, rankBetween, resolveZone } from '@/domain';
import type { Neighbours, RankRule, Task, ZoneMoveKey } from '@/domain';

import { LATER, ZONES, inZone } from './fixtures';

/**
 * Таблица переходов — не документация, а то, по чему `placeTask` принимает решение.
 *
 * Отсюда важная тонкость про эти тесты. Проверка «строка совпадает с поведением»
 * сама по себе враньё в таблице не поймает: мутация читает ту же строку, поэтому
 * они согласованы по построению. Ловит его отдельная проверка правила, выведенного
 * из спеки, а не из таблицы. Цепочка получается из двух звеньев, и оба нужны:
 *
 *   спека §1 → (тест правила) → таблица → (тест поведения) → placeTask
 */
describe('ZONE_MOVES', () => {
  it('покрывает все 25 переходов между пятью зонами', () => {
    expect(Object.keys(ZONE_MOVES)).toHaveLength(ZONES.length * ZONES.length);

    for (const from of ZONES) {
      for (const to of ZONES) {
        expect(ZONE_MOVES[`${from}->${to}`], `${from}->${to}`).toBeDefined();
      }
    }
  });

  it('ранг во «Входящие» не трогается, в квадрант — перегенерируется', () => {
    for (const from of ZONES) {
      for (const to of ZONES) {
        const expected: RankRule = to === 'inbox' ? 'keep' : 'regenerate';

        expect(ZONE_MOVES[`${from}->${to}`], `${from}->${to}`).toBe(expected);
      }
    }
  });

  it('каждая строка совпадает с тем, что moveToZone делает на самом деле', () => {
    for (const from of ZONES) {
      for (const to of ZONES) {
        const label: ZoneMoveKey = `${from}->${to}`;
        const task: Task = inZone(from, 'a1');
        const neighbour: Task = inZone(to, 'a5');
        const between: Neighbours = { before: neighbour, after: null };

        const moved: Task = moveToZone(task, to, between, LATER);

        expect(resolveZone(moved), label).toBe(to);

        if (ZONE_MOVES[label] === 'keep') {
          expect(moved.rank, label).toBe(task.rank);
        } else {
          expect(moved.rank, label).toBe(rankBetween(between));
        }
      }
    }
  });

  it('переход внутри «Входящих» вообще ничего не меняет', () => {
    const task: Task = inZone('inbox', 'a1');

    expect(moveToZone(task, 'inbox', { before: null, after: null }, LATER)).toBe(task);
  });
});
