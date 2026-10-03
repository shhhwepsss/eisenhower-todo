import { resolveZone } from '@eisenhower/core';
import type { Neighbours, Task, Zone } from '@eisenhower/core';
import type { MatrixZones } from '@/state';
import type { DropTarget } from '../types';
import { ZONE_PREFIX } from '../constants/zone-prefix.constant';

export const zoneDroppableId = (zone: Zone): string => `${ZONE_PREFIX}${zone}`;

const zoneOfDroppable = (id: string): Zone | null => {
  if (!id.startsWith(ZONE_PREFIX)) return null;
  return id.slice(ZONE_PREFIX.length) as Zone;
};

const zoneOfTask = (zones: MatrixZones, taskId: string): Zone | null => {
  const found: Task | undefined = Object.values(zones)
    .flat()
    .find((task) => task.id === taskId);
  if (found === undefined) return null;
  return resolveZone(found);
};

/**
 * Соседи для позиции `position` в списке, из которого перетаскиваемая задача
 * уже убрана: слева тот, кто окажется выше, справа — тот, кто ниже.
 */
const neighboursAt = (list: Task[], position: number): Neighbours => {
  return { before: list[position - 1] ?? null, after: list[position] ?? null };
};

export const resolveDrop = (
  zones: MatrixZones,
  activeId: string,
  overId: string,
): DropTarget | null => {
  // Бросок на самого себя — жест без намерения: двигать нечего и некуда.
  if (activeId === overId) return null;

  const droppedOnZone: Zone | null = zoneOfDroppable(overId);
  const destination: Zone | null = droppedOnZone ?? zoneOfTask(zones, overId);
  if (destination === null) return null;

  const full: Task[] = zones[destination];
  const rest: Task[] = full.filter((task) => task.id !== activeId);

  // Бросок на саму зону, а не на карточку, — задача встаёт в конец.
  if (droppedOnZone !== null) return { zone: destination, between: neighboursAt(rest, rest.length) };

  const overIndex: number = rest.findIndex((task) => task.id === overId);
  if (overIndex === -1) return null;

  /**
   * Направление броска решает, встать до карточки-цели или после неё. Внутри
   * одной зоны его видно по индексам: тащили сверху вниз — значит цель должна
   * остаться выше. Между зонами направления нет, и задача встаёт перед целью.
   */
  const fromIndex: number = full.findIndex((task) => task.id === activeId);
  const overIndexFull: number = full.findIndex((task) => task.id === overId);
  const draggedDown: boolean = fromIndex !== -1 && fromIndex < overIndexFull;

  return { zone: destination, between: neighboursAt(rest, draggedDown ? overIndex + 1 : overIndex) };
};
