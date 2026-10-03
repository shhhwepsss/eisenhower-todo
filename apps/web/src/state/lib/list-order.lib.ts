import type { ListSortKey, Task } from '@eisenhower/core';
import { COMPARATORS } from '../constants/list-comparators.constant';

/**
 * Порядок задач внутри группы списка (PRD §3 «Порядок задач»).
 *
 * Сортировка — свойство вида, а не задачи: она ничего не пишет в `Task` и не
 * трогает `rank` — DERIVED_ORDER_IS_NOT_STORED. Поэтому она и живёт здесь,
 * рядом с выборкой, а не в домене: доменного правила в ней нет, есть выбор
 * пользователя, как ему удобнее смотреть инвентарь.
 */

export const sortForList = (tasks: readonly Task[], key: ListSortKey): Task[] => {
  return [...tasks].sort(COMPARATORS[key]);
};
