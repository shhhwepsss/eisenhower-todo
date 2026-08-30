import { ListTab } from '@/ui/list';
import { MatrixTab } from '@/ui/matrix';
import { Tabs } from './children/Tabs';
import { useActiveTab } from './hooks/use-active-tab';
import styles from './App.module.scss';

export function App() {
  const { activeTab, selectTab } = useActiveTab();

  return (
    <main className={styles.app}>
      <h1 className={styles.title}>Eisenhower Todo</h1>
      <Tabs activeTab={activeTab} onSelect={selectTab} />
      {activeTab === 'list' ? <ListTab /> : <MatrixTab />}
    </main>
  );
}
