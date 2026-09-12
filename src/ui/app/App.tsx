import { useStorageStatus } from '@/state';
import type { StorageStatus } from '@/state';
import { ListTab } from '@/ui/list';
import { MatrixTab } from '@/ui/matrix';
import { AppLoader } from './children/AppLoader';
import { AppStorageError } from './children/AppStorageError';
import { StorageBanner } from './children/StorageBanner';
import { Tabs } from './children/Tabs';
import { ThemeSelect } from './children/ThemeSelect';
import { useActiveTab } from './hooks/use-active-tab';
import { useApplyTheme } from './hooks/use-apply-theme';
import styles from './App.module.scss';

/**
 * Правило хуков соблюдено даже во время загрузки и при отказе хранилища:
 * `useActiveTab` вызывается безусловно, а решение, что рендерить, принимается
 * уже после — на уровне того, что рендерится, а не какие хуки вызываются.
 *
 * `unavailable` и `write-failed` — разные беды с разным ответом экрана
 * (см. `StorageStatus`). При `unavailable` задач ещё нет — экран отдаётся
 * `AppStorageError` целиком, вкладки не монтируются, и создать задачу нельзя.
 * При `write-failed` задачи уже в состоянии — прятать их было бы потерей
 * (STORAGE_FAILURE_IS_VISIBLE, docs/specs/4-architecture.md §3), поэтому
 * вкладки остаются, а отказ виден постоянной полосой `StorageBanner` сверху.
 */
export const App = () => {
  const { activeTab, selectTab } = useActiveTab();
  const status: StorageStatus = useStorageStatus();
  const showTabs: boolean = status === 'ready' || status === 'write-failed';
  useApplyTheme();

  return (
    <main className={styles.app}>
      <div className={styles.header}>
        <h1 className={styles.title}>Eisenhower Todo</h1>
        <ThemeSelect />
      </div>
      {status === 'loading' && <AppLoader />}
      {status === 'unavailable' && <AppStorageError />}
      {showTabs && (
        <>
          <StorageBanner />
          <Tabs activeTab={activeTab} onSelect={selectTab} />
          {activeTab === 'list' ? <ListTab /> : <MatrixTab />}
        </>
      )}
    </main>
  );
};
