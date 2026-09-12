import { isTaskLive } from '@/domain';
import type { Task } from '@/domain';

import { useStore } from '../context';
import type { Store } from '../types';

/**
 * Одна задача по идентификатору (docs/specs/40-task-modal.md).
 *
 * Нужна окну правки: оно хранит идентификатор, а не задачу, и обязано на каждый
 * рендер брать текущую версию — иначе правка в самом окне не отражалась бы
 * в нём же.
 *
 * Надгробия не возвращаются (DELETE_IS_A_TOMBSTONE): удалённая задача перестаёт
 * находиться, и открытое окно закрывается само, вместо того чтобы показывать
 * запись, которой в инвентаре уже нет.
 *
 * `null` на входе — это «ничего не открыто», а не «найди что-нибудь»: так
 * вызывающей стороне не приходится сторожить вызов хука условием.
 *
 * Матрица берёт свою задачу иначе — `findTaskInZones` ищет среди тех, что видны
 * на её сетке (выполненные туда не попадают, DONE_LEAVES_MATRIX). Это другой
 * вопрос, а не другая реализация того же: список показывает весь инвентарь.
 */
export const useTask = (id: string | null): Task | null => {
  const { state }: Store = useStore();
  if (id === null) return null;

  const live: Task[] = state.tasks.filter(isTaskLive);
  const found: Task | undefined = live.find((task) => task.id === id);
  return found ?? null;
};
