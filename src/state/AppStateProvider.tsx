import { useEffect, useReducer, useRef } from 'react';
import type { RefObject } from 'react';
import type { Task, UiSettings } from '@/domain';
import { describeError } from '@/shared/errors';

import { StoreContext } from './context';
import { INITIAL_APP_STATE } from './constants';
import { log } from './log';
import { reducer } from './reducer';
import type { AppStateProviderProps, Store } from './types';

/**
 * Вход в слой состояния: стор, чтение снапшота и персист (спека §5).
 *
 * Чтение идёт в эффекте после первого рендера, поэтому первый кадр приложения —
 * пустая матрица. Это сознательное расхождение со спекой §3 («состояния
 * „загружаемся“ у приложения нет») ради простоты входа: отдельного экрана
 * загрузки не будет, а если мигание окажется заметным на реальных данных —
 * это отдельная задача с замером, а не спиннер «на всякий случай».
 *
 * Запись — эффект, а не часть редьюсера: редьюсер остаётся чистым и тестируется
 * без моков, а хранилище получает уже применённое состояние.
 */
export const AppStateProvider = ({ repositories, children }: AppStateProviderProps) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_APP_STATE);

  /**
   * Что уже лежит в хранилище. Персист сравнивает ссылки с этими двумя: снапшот,
   * который только что прочитан, записывать обратно незачем, а редьюсер возвращает
   * то же состояние на no-op — значит и ссылка не меняется, и записи не будет.
   */
  const savedTasks: RefObject<readonly Task[]> = useRef<readonly Task[]>(INITIAL_APP_STATE.tasks);
  const savedSettings: RefObject<UiSettings> = useRef<UiSettings>(INITIAL_APP_STATE.ui);

  /**
   * До первого чтения не пишем ничего: иначе действие, случившееся раньше ответа
   * хранилища, записало бы пустой снапшот поверх непрочитанного.
   */
  const isLoaded: RefObject<boolean> = useRef<boolean>(false);

  useEffect(() => {
    let cancelled: boolean = false;

    const loadSnapshot = async (): Promise<void> => {
      try {
        const tasks: Task[] = await repositories.tasks.loadAll();
        const ui: UiSettings = await repositories.settings.load();
        if (cancelled) return;
        savedTasks.current = tasks;
        savedSettings.current = ui;
        isLoaded.current = true;
        dispatch({ type: 'snapshot/loaded', tasks, ui });
      } catch (error) {
        if (cancelled) return;
        /**
         * CORRUPTED_SNAPSHOT_IS_PRESERVED: прочитать не удалось — значит и писать
         * нельзя. Первая же запись затёрла бы строку, из которой данные ещё можно
         * достать руками. Персист выключается до конца сессии.
         */
        isLoaded.current = true;
        log.error('снапшот не прочитан — запись выключена', describeError(error));
        dispatch({ type: 'storage/failed' });
      }
    };

    void loadSnapshot();

    return (): void => {
      cancelled = true;
    };
  }, [repositories]);

  useEffect(() => {
    if (!isLoaded.current) return;
    if (state.storage === 'error') return;
    if (state.tasks === savedTasks.current) return;

    const tasks: readonly Task[] = state.tasks;
    savedTasks.current = tasks;

    /**
     * Единица записи — весь снапшот, STORAGE_WRITE_IS_ATOMIC. Отказ не откатывает
     * состояние в памяти: пользователь свою правку видит, а приложение честно
     * говорит, что сохранить её не смогло.
     */
    void repositories.tasks.saveAll(tasks).catch((error: unknown) => {
      log.error('снапшот задач не записан', describeError(error));
      dispatch({ type: 'storage/failed' });
    });
  }, [repositories, state.tasks, state.storage]);

  useEffect(() => {
    if (!isLoaded.current) return;
    if (state.storage === 'error') return;
    if (state.ui === savedSettings.current) return;

    const settings: UiSettings = state.ui;
    savedSettings.current = settings;

    void repositories.settings.save(settings).catch((error: unknown) => {
      log.error('снапшот настроек не записан', describeError(error));
      dispatch({ type: 'storage/failed' });
    });
  }, [repositories, state.ui, state.storage]);

  const store: Store = { state, dispatch };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};
