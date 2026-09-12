import { DEFAULT_UI_SETTINGS } from '@/domain';

import type { AppState } from '../types';

/**
 * С чего стартует приложение до того, как прочитан снапшот (спека §5).
 *
 * Задач нет, а хранилище — в состоянии `loading`: снапшот ещё не прочитан,
 * и пока это не изменится, писать в хранилище нельзя (см. `StorageStatus`).
 * Пустой массив — та же ссылка на всё время жизни модуля, и это не мелочь:
 * персист сравнивает ссылки, чтобы не записать снапшот, которого пользователь
 * ещё не менял.
 */
export const INITIAL_APP_STATE: AppState = {
  tasks: [],
  ui: DEFAULT_UI_SETTINGS,
  storage: 'loading',
};
