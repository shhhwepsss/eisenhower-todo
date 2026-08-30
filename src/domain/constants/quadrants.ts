import type { PriorityFlags, Quadrant } from '../types';

/**
 * Единственная таблица соответствия «квадрант → пара признаков»
 * (docs/specs/4-architecture.md §2). Обратное направление — `resolveQuadrantPlacement`
 * в placement.ts; что две стороны не разошлись, проверяет тест на круговой обход.
 */
export const QUADRANT_FLAGS: Record<Quadrant, PriorityFlags> = {
  Q1: { urgent: true, important: true },
  Q2: { urgent: false, important: true },
  Q3: { urgent: true, important: false },
  Q4: { urgent: false, important: false },
};

/**
 * Список квадрантов выводится из таблицы, а не выписан вторым литералом: иначе
 * добавленный квадрант пришлось бы вписать в двух местах, а компилятор поймал бы
 * только одно из них.
 *
 * Приведение типа безопасно: `Record<Quadrant, ...>` требует ровно эти ключи —
 * ни одного лишнего, ни одного пропущенного. Порядок — порядок объявления в таблице.
 */
export const QUADRANTS = Object.keys(QUADRANT_FLAGS) as readonly Quadrant[];
