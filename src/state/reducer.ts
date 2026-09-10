import {
  createTask,
  deleteTask,
  editText,
  editTitle,
  moveToZone,
  setPriority,
  setStatus,
} from '@/domain';
import type { Task } from '@/domain';

import { log } from './log';
import type { Action, AppState } from './types';

/**
 * Редьюсер состояния (docs/specs/4-architecture.md §5).
 *
 * REDUCER_IS_PURE: здесь не читается время, не генерируется `id` и ничего не
 * пишется в хранилище — всё это приходит в действии либо происходит в эффекте
 * персиста. Поэтому редьюсер тестируется вызовом функции, без React и без моков.
 *
 * Домен по правилу CLAUDE.md §9 молчит, а его мутации возвращают ту же задачу,
 * когда менять нечего. Значит «действие свернулось в no-op» видно только отсюда —
 * сравнением ссылки до и после, и логируется тоже отсюда.
 *
 * Действия хранилища (`snapshot/loaded`, `storage/failed`) чистоты не нарушают:
 * читает и пишет эффект в провайдере, сюда приезжает уже готовый результат.
 */

/** Мутация задачи в терминах домена: задача плюс намерение — новая задача. */
type TaskMutation = (task: Task) => Task;

/**
 * Единственное место, где массив задач пересобирается.
 *
 * Идемпотентность (спека §10) держится ссылкой: домен вернул ту же задачу —
 * возвращаем то же состояние. Тогда повтор действия не рождает нового объекта
 * состояния, не двигает `updatedAt` и не запускает персист.
 */
const applyToTask = (state: AppState, id: string, mutate: TaskMutation): AppState => {
  const current: Task | undefined = state.tasks.find((task) => task.id === id);

  if (current === undefined) {
    log.warn('действие адресовано задаче, которой нет в состоянии', { id });
    return state;
  }

  const next: Task = mutate(current);

  if (next === current) {
    log.debug('домен вернул ту же задачу: действие свернулось в no-op', { id });
    return state;
  }

  const tasks: Task[] = state.tasks.map((task) => (task.id === id ? next : task));
  return { ...state, tasks };
};

/** Новая задача встаёт в конец массива: порядок «Входящих» задаёт `createdAt`, а не позиция. */
const addTask = (state: AppState, task: Task): AppState => {
  return { ...state, tasks: [...state.tasks, task] };
};

export const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'task/added': {
      const task: Task = createTask({
        id: action.id,
        title: action.title,
        text: action.text,
        now: action.now,
      });
      log.info('задача создана', { id: task.id });
      return addTask(state, task);
    }
    case 'task/title-edited':
      return applyToTask(state, action.id, (task) => editTitle(task, action.title, action.now));
    case 'task/text-edited':
      return applyToTask(state, action.id, (task) => editText(task, action.text, action.now));
    case 'task/status-set':
      return applyToTask(state, action.id, (task) =>
        setStatus(task, action.status, action.between, action.now),
      );
    case 'task/priority-set':
      return applyToTask(state, action.id, (task) =>
        setPriority(task, action.priority, action.between, action.now),
      );
    case 'task/moved':
      return applyToTask(state, action.id, (task) =>
        moveToZone(task, action.to, action.between, action.now),
      );
    case 'task/deleted':
      return applyToTask(state, action.id, (task) => deleteTask(task, action.now));
    case 'snapshot/loaded': {
      log.info('снапшот прочитан', { count: action.tasks.length, listSort: action.ui.listSort });
      return { ...state, tasks: action.tasks, ui: action.ui, storage: 'ready' };
    }
    case 'storage/failed': {
      if (state.storage === 'error') return state;
      log.warn('хранилище отказало: персист выключен до конца сессии');
      return { ...state, storage: 'error' };
    }
    case 'list-sort/selected': {
      if (state.ui.listSort === action.key) return state;
      log.info('сортировка списка выбрана', { from: state.ui.listSort, to: action.key });
      return { ...state, ui: { ...state.ui, listSort: action.key } };
    }
  }
};
