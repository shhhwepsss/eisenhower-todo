import { QUADRANTS, resolveZone } from '@/domain';
import type { ListSortKey, Task, TaskStatus, Zone } from '@/domain';

/**
 * Порядок задач внутри группы списка (PRD §3 «Порядок задач»).
 *
 * Сортировка — свойство вида, а не задачи: она ничего не пишет в `Task` и не
 * трогает `rank` — DERIVED_ORDER_IS_NOT_STORED. Поэтому она и живёт здесь,
 * рядом с выборкой, а не в домене: доменного правила в ней нет, есть выбор
 * пользователя, как ему удобнее смотреть инвентарь.
 */

/** Порядок статусов — рабочий: сначала то, что в работе, потом сделанное. */
const STATUS_ORDER: Record<TaskStatus, number> = { in_progress: 0, todo: 1, done: 2 };

/**
 * Порядок зон читается из списка квадрантов, а не выписывается вторым литералом:
 * иначе добавленный квадрант пришлось бы вписать в двух местах, и компилятор
 * поймал бы только одно из них. «Входящие» идут последними — неразобранное
 * не притворяется приоритетным.
 */
const zoneOrder = (zone: Zone): number => {
  if (zone === 'inbox') return QUADRANTS.length;
  return QUADRANTS.indexOf(zone);
};

/** Новые сверху: у списка та же логика свежести, что и у зоны «Входящие». */
const byCreatedDesc = (a: Task, b: Task): number => {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  return a.id < b.id ? -1 : 1;
};

/**
 * Сравнение с учётом языка и регистра: без `localeCompare` «Яблоко» и «яблоко»
 * разъезжаются по разным концам списка, потому что сравниваются коды символов.
 */
const byTitle = (a: Task, b: Task): number => {
  const byLabel: number = a.title.localeCompare(b.title, 'ru');
  if (byLabel !== 0) return byLabel;
  return a.id < b.id ? -1 : 1;
};

/** Равные ключи разводятся свежестью, иначе порядок внутри пачки был бы случайным. */
const byRank = (rank: (task: Task) => number) => {
  return (a: Task, b: Task): number => {
    const difference: number = rank(a) - rank(b);
    if (difference !== 0) return difference;
    return byCreatedDesc(a, b);
  };
};

const COMPARATORS: Record<ListSortKey, (a: Task, b: Task) => number> = {
  created: byCreatedDesc,
  alphabet: byTitle,
  status: byRank((task) => STATUS_ORDER[task.status]),
  quadrant: byRank((task) => zoneOrder(resolveZone(task))),
};

export const sortForList = (tasks: readonly Task[], key: ListSortKey): Task[] => {
  return [...tasks].sort(COMPARATORS[key]);
};
