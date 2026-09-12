import { useStorageStatus } from '@/state';
import type { StorageStatus } from '@/state';
import { ListTab } from '@/ui/list';
import { MatrixTab } from '@/ui/matrix';
import { AppLoader } from './children/AppLoader';
import { AppMenu } from './children/AppMenu';
import { AppStorageError } from './children/AppStorageError';
import { StorageBanner } from './children/StorageBanner';
import { useActiveTab } from './hooks/use-active-tab';
import { useApplyTheme } from './hooks/use-apply-theme';
import styles from './App.module.scss';

/**
 * Правило хуков соблюдено даже во время загрузки и при отказе хранилища:
 * `useActiveTab` вызывается безусловно, а решение, что рендерить, принимается
 * уже после — на уровне того, что рендерится, а не какие хуки вызываются.
 *
 * `unavailable` и `write-failed` — разные беды с разным ответом экрана
 * (см. `StorageStatus`). При `unavailable` задач ещё нет — контент отдаётся
 * `AppStorageError` целиком, вкладки не монтируются, и создать задачу нельзя.
 * При `write-failed` задачи уже в состоянии — прятать их было бы потерей
 * (STORAGE_FAILURE_IS_VISIBLE, docs/specs/4-architecture.md §3), поэтому
 * вкладки остаются, а отказ виден постоянной полосой `StorageBanner` сверху.
 *
 * Меню видно при любом статусе, а список вкладок внутри него — только когда
 * вкладки смонтированы: бренд и переключатель темы не зависят от того,
 * прочитан ли снапшот, а вкладка, ведущая в никуда, — ведёт в никуда.
 */
export const App = () => {
  const { activeTab, selectTab } = useActiveTab();
  const status: StorageStatus = useStorageStatus();
  const showTabs: boolean = status === 'ready' || status === 'write-failed';
  useApplyTheme();

  return (
    <div className={styles.shell}>
      <AppMenu activeTab={activeTab} onSelect={selectTab} showTabs={showTabs} />
      <main className={styles.main}>
        {status === 'loading' && <AppLoader />}
        {status === 'unavailable' && <AppStorageError />}
        {showTabs && (
          <>
            <StorageBanner />
            {activeTab === 'list' ? <ListTab /> : <MatrixTab />}
          </>
        )}
      </main>
    </div>
  );
};
