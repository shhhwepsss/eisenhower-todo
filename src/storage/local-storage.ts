import { DEFAULT_UI_SETTINGS } from '@/domain';
import type { Task, UiSettings } from '@/domain';
import { describeError } from '@/shared/errors';

import { SETTINGS_KEY, TASKS_KEY } from './constants';
import { decodeSettings, decodeTasks } from './decode';
import { openEnvelope, sealEnvelope } from './envelope';
import { storageError } from './errors';
import { log } from './log';
import type {
  KeyValueStorage,
  SettingsRepository,
  SnapshotEnvelope,
  TaskRepository,
} from './types';

/**
 * Адаптер `localStorage` (docs/specs/4-architecture.md §3, §4).
 *
 * Хранилище приходит параметром, а не берётся из `window`: так адаптер работает
 * и с запасным хранилищем в памяти, и с подделкой в тесте, а обращение к глобали
 * остаётся ровно в одном месте — на входе в приложение.
 */

/**
 * Обращение к хранилищу может бросить и на чтении: приватный режим Safari,
 * отключённые куки, политика origin. Это не «данные повреждены», а «хранилища нет».
 */
const read = (storage: KeyValueStorage, key: string): string | null => {
  try {
    return storage.getItem(key);
  } catch (cause) {
    throw storageError('unavailable', `хранилище не отдаёт ключ ${key}`, { cause });
  }
};

/**
 * Единственная точка записи — STORAGE_WRITE_IS_ATOMIC: один `setItem` со всем
 * документом. Отказ (квота, приватный режим) уходит наверх, а не проглатывается:
 * состояние в памяти при этом остаётся консистентным, потерян только снимок.
 */
const write = (storage: KeyValueStorage, key: string, snapshot: string): void => {
  try {
    storage.setItem(key, snapshot);
  } catch (cause) {
    throw storageError('write-failed', `снапшот не записан в ${key}`, { cause });
  }
};

export const createLocalTaskRepository = (storage: KeyValueStorage): TaskRepository => {
  return {
    loadAll: async (): Promise<Task[]> => {
      const raw: string | null = read(storage, TASKS_KEY);
      if (raw === null) {
        log.info('снапшота задач нет — первый запуск', { key: TASKS_KEY });
        return [];
      }

      const envelope: SnapshotEnvelope = openEnvelope(raw);
      const tasks: Task[] = decodeTasks(envelope, raw);
      log.info('снапшот задач прочитан', { key: TASKS_KEY, count: tasks.length });
      return tasks;
    },

    saveAll: async (tasks: readonly Task[]): Promise<void> => {
      const snapshot: string = sealEnvelope({ tasks });
      write(storage, TASKS_KEY, snapshot);
      log.debug('снапшот задач записан', { count: tasks.length, bytes: snapshot.length });
    },
  };
};

/**
 * Настройки читаются мягче задач: испорченный снапшот чинится дефолтом, а не
 * отказом. Потеря здесь — один клик по переключателю сортировки, и требовать
 * за неё разговор с пользователем несоразмерно.
 *
 * Недоступность хранилища мягкой обработке не подлежит и летит наверх: это не
 * «настройка не прочиталась», а «писать всё равно будет некуда».
 */
const openSettings = (storage: KeyValueStorage): SnapshotEnvelope | null => {
  const raw: string | null = read(storage, SETTINGS_KEY);
  if (raw === null) return null;

  try {
    return openEnvelope(raw);
  } catch (error) {
    log.warn('снапшот настроек не читается, беру значения по умолчанию', describeError(error));
    return null;
  }
};

export const createLocalSettingsRepository = (storage: KeyValueStorage): SettingsRepository => {
  return {
    load: async (): Promise<UiSettings> => {
      const envelope: SnapshotEnvelope | null = openSettings(storage);
      if (envelope === null) return { ...DEFAULT_UI_SETTINGS };
      return decodeSettings(envelope);
    },

    save: async (settings: UiSettings): Promise<void> => {
      const snapshot: string = sealEnvelope(settings);
      write(storage, SETTINGS_KEY, snapshot);
      log.debug('снапшот настроек записан', { listSort: settings.listSort });
    },
  };
};
