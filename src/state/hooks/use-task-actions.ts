import { resolveZone, resolveZoneByPriority } from '@/domain';
import type { Neighbours, Priority, Task, TaskStatus, Zone } from '@/domain';

import { useStore } from '../context';
import { createId, endOfZone, now } from '../helpers';
import type { Store, TaskActions } from '../types';

/**
 * Единственный способ изменить задачу (docs/specs/4-architecture.md §5).
 *
 * Здесь граница чистого и грязного: `id` и время рождаются в этих функциях,
 * дальше едут в payload действия, и редьюсер их только раскладывает —
 * REDUCER_IS_PURE.
 *
 * Здесь же выбираются соседи. Создателю действия нужно текущее состояние, чтобы
 * ответить «что лежит в конце квадранта-приёмника», поэтому создатели и живут
 * в хуке, а не отдельным модулем без доступа к стору.
 *
 * Ручной мемоизации нет: этим занимается React Compiler, а `dispatch` стабилен
 * между рендерами по контракту React (CLAUDE.md §7).
 */
export const useTaskActions = (): TaskActions => {
  const { state, dispatch }: Store = useStore();

  const findTask = (id: string): Task | undefined => {
    return state.tasks.find((task) => task.id === id);
  };

  /**
   * Конец зоны, в которой задача окажется после действия, — туда она встаёт,
   * когда позицию не назначил явный жест (PRD §3 «Куда встаёт задача»).
   */
  const endOfDestination = (zone: Zone): Neighbours => {
    return endOfZone(state.tasks, zone);
  };

  return {
    addTask: (title, text = ''): void => {
      dispatch({ type: 'task/added', id: createId(), title, text, now: now() });
    },

    editTitle: (id, title): void => {
      dispatch({ type: 'task/title-edited', id, title, now: now() });
    },

    editText: (id, text): void => {
      dispatch({ type: 'task/text-edited', id, text, now: now() });
    },

    /**
     * Соседи нужны только на возврате из `done` — там задача встаёт в конец своего
     * прежнего квадранта (PRD S6a). Какой это квадрант, знают признаки самой задачи:
     * `setStatus` их не трогает, PRIORITY_SURVIVES_DONE.
     */
    setStatus: (id, status: TaskStatus): void => {
      const task: Task | undefined = findTask(id);
      if (task === undefined) return;
      const zone: Zone = resolveZone(task);
      dispatch({ type: 'task/status-set', id, status, between: endOfDestination(zone), now: now() });
    },

    setPriority: (id, priority: Priority): void => {
      const zone: Zone = resolveZoneByPriority(priority);
      dispatch({
        type: 'task/priority-set',
        id,
        priority,
        between: endOfDestination(zone),
        now: now(),
      });
    },

    /** Место назначил жест пользователя, поэтому соседи приходят снаружи, а не отсюда. */
    moveToZone: (id, to: Zone, between: Neighbours): void => {
      dispatch({ type: 'task/moved', id, to, between, now: now() });
    },

    deleteTask: (id): void => {
      dispatch({ type: 'task/deleted', id, now: now() });
    },
  };
};
