import { QUADRANTS } from '@eisenhower/core';
import type { Task, Zone } from '@eisenhower/core';

/** Сравнения задач для сортировок списка (`constants/list-comparators.constant.ts`). */

/**
 * Порядок зон читается из списка квадрантов, а не выписывается вторым литералом:
 * иначе добавленный квадрант пришлось бы вписать в двух местах, и компилятор
 * поймал бы только одно из них. «Входящие» идут последними — неразобранное
 * не притворяется приоритетным.
 */
export const zoneOrder = (zone: Zone): number => {
  if (zone === 'inbox') return QUADRANTS.length;
  return QUADRANTS.indexOf(zone);
};

/** Новые сверху: у списка та же логика свежести, что и у зоны «Входящие». */
export const byCreatedDesc = (a: Task, b: Task): number => {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  return a.id < b.id ? -1 : 1;
};

/**
 * Сравнение с учётом языка и регистра: без `localeCompare` «Яблоко» и «яблоко»
 * разъезжаются по разным концам списка, потому что сравниваются коды символов.
 */
export const byTitle = (a: Task, b: Task): number => {
  const byLabel: number = a.title.localeCompare(b.title, 'ru');
  if (byLabel !== 0) return byLabel;
  return a.id < b.id ? -1 : 1;
};

/** Равные ключи разводятся свежестью, иначе порядок внутри пачки был бы случайным. */
export const byRank = (rank: (task: Task) => number) => {
  return (a: Task, b: Task): number => {
    const difference: number = rank(a) - rank(b);
    if (difference !== 0) return difference;
    return byCreatedDesc(a, b);
  };
};
