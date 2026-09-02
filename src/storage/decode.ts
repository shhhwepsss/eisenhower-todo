import { DEFAULT_UI_SETTINGS } from '@/domain';
import type { ListSortKey, Task, TaskStatus, UiSettings } from '@/domain';

import { storageError } from './errors';
import { isFilledString, isRecord, isTimestamp } from './guards';
import { log } from './log';
import type { SnapshotEnvelope } from './types';

/**
 * Содержимое конверта → значения, с которыми работает приложение
 * (SNAPSHOT_SHAPE_IS_CHECKED, docs/specs/4-architecture.md §3).
 *
 * Задачи и настройки читаются с разной строгостью, и это сознательно.
 * Задача — данные пользователя: сломанную запись нельзя ни выбросить, ни
 * починить угадыванием, поэтому весь снапшот объявляется нечитаемым, а исходная
 * строка остаётся в хранилище нетронутой. Настройка — предпочтение: неизвестное
 * значение стоит ровно один клик, поэтому оно чинится дефолтом.
 */

/**
 * Множества значений заданы `Record`ом от типа, а не списком: список пришлось бы
 * держать в согласии с объединением вручную, а `Record` требует все ключи —
 * новый статус без строки здесь не соберётся.
 */
const TASK_STATUSES: Record<TaskStatus, true> = { todo: true, in_progress: true, done: true };

const LIST_SORT_KEYS: Record<ListSortKey, true> = {
  created: true,
  alphabet: true,
  status: true,
  quadrant: true,
};

const isTaskStatus = (value: unknown): value is TaskStatus => {
  return typeof value === 'string' && Object.hasOwn(TASK_STATUSES, value);
};

const isListSortKey = (value: unknown): value is ListSortKey => {
  return typeof value === 'string' && Object.hasOwn(LIST_SORT_KEYS, value);
};

/**
 * Имя первого поля, которое не прошло проверку, либо `null`, если прошли все.
 *
 * Тип `Record<keyof Task, boolean>` — здесь главное: поле, добавленное в `Task`
 * без проверки, не скомпилируется. Именно это делает разбор проверкой формы,
 * а не набором догадок, устаревающих с первой же правкой модели.
 */
const brokenFieldOf = (fields: Record<string, unknown>): string | null => {
  const checked: Record<keyof Task, boolean> = {
    id: isFilledString(fields['id']),
    title: isFilledString(fields['title']),
    text: typeof fields['text'] === 'string',
    assigned: typeof fields['assigned'] === 'boolean',
    urgent: typeof fields['urgent'] === 'boolean',
    important: typeof fields['important'] === 'boolean',
    status: isTaskStatus(fields['status']),
    rank: isFilledString(fields['rank']),
    createdAt: isTimestamp(fields['createdAt']),
    updatedAt: isTimestamp(fields['updatedAt']),
    deletedAt: fields['deletedAt'] === null || isTimestamp(fields['deletedAt']),
  };

  const broken: [string, boolean] | undefined = Object.entries(checked).find(([, ok]) => !ok);
  return broken?.[0] ?? null;
};

const decodeTask = (value: unknown, index: number, raw: string): Task => {
  if (!isRecord(value)) {
    throw storageError('unreadable', `задача №${index} в снапшоте — не объект`, { raw });
  }

  const broken: string | null = brokenFieldOf(value);
  if (broken !== null) {
    throw storageError('unreadable', `у задачи №${index} не читается поле «${broken}»`, { raw });
  }

  /**
   * Приведение проверено компилятором: `brokenFieldOf` перебирает поля через
   * `Record<keyof Task, boolean>`, а `null` означает, что прошли все до одного.
   */
  return value as Task;
};

/**
 * Одна невалидная задача делает нечитаемым весь снапшот — решение из #20.
 * Альтернатива, «выбросить сломанную и продолжить», теряет данные пользователя
 * молча и не в момент чтения, а при следующем сохранении.
 *
 * Надгробия возвращаются наравне с живыми задачами: их прячет выборка, а не
 * хранилище (DELETE_IS_A_TOMBSTONE).
 */
export const decodeTasks = (envelope: SnapshotEnvelope, raw: string): Task[] => {
  const tasks: unknown = envelope['tasks'];
  if (!Array.isArray(tasks)) {
    throw storageError('unreadable', 'в снапшоте нет списка задач', { raw });
  }

  return tasks.map((task: unknown, index: number) => decodeTask(task, index, raw));
};

/** Неизвестный ключ сортировки чинится дефолтом: настройка дешевле отказа. */
export const decodeSettings = (envelope: SnapshotEnvelope): UiSettings => {
  const listSort: unknown = envelope['listSort'];
  if (isListSortKey(listSort)) return { listSort };

  log.warn('неизвестный ключ сортировки списка, беру значение по умолчанию', {
    listSort,
    fallback: DEFAULT_UI_SETTINGS.listSort,
  });
  return { ...DEFAULT_UI_SETTINGS };
};
