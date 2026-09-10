import { useIsLoading } from '@/state';
import { ListTab } from '@/ui/list';
import { MatrixTab } from '@/ui/matrix';
import { AppLoader } from './children/AppLoader';
import { StorageBanner } from './children/StorageBanner';
import { Tabs } from './children/Tabs';
import { useActiveTab } from './hooks/use-active-tab';
import styles from './App.module.scss';

/**
 * Правило хуков соблюдено даже во время загрузки: `useActiveTab` вызывается
 * безусловно, а решение показать загрузчик вместо вкладок принимается уже
 * после — на уровне того, что рендерится, а не какие хуки вызываются.
 */
export const App = () => {
  const { activeTab, selectTab } = useActiveTab();
  const isLoading: boolean = useIsLoading();

  return (
    <main className={styles.app}>
      <h1 className={styles.title}>Eisenhower Todo</h1>
      <StorageBanner />
      {isLoading ? (
        <AppLoader />
      ) : (
        <>
          <Tabs activeTab={activeTab} onSelect={selectTab} />
          {activeTab === 'list' ? <ListTab /> : <MatrixTab />}
        </>
      )}
    </main>
  );
};
