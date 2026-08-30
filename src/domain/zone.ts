import type { Placement, Zone } from './types';

/**
 * Плоское имя зоны — ключ, по которому читается таблица переходов ZONE_MOVES.
 *
 * Структурная форма (`Placement`) остаётся основной: она не даёт представить
 * невозможное состояние. `Zone` нужна ровно затем, чтобы переходы можно было
 * выписать таблицей и увидеть их все сразу.
 */
export function zoneOf(placement: Placement): Zone {
  return placement.zone === 'inbox' ? 'inbox' : placement.quadrant;
}

export function placementOfZone(zone: Zone): Placement {
  return zone === 'inbox' ? { zone: 'inbox' } : { zone: 'quadrant', quadrant: zone };
}
