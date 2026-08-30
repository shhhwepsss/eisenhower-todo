import { ListTab } from '@/ui/list';
import { MatrixTab } from '@/ui/matrix';
import { useActiveTab } from './lib/use-active-tab';
import { Tabs } from './tabs';
import './app.css';

export function App() {
  const { activeTab, selectTab } = useActiveTab();

  return (
    <main className="app">
      <h1 className="app__title">Eisenhower Todo</h1>
      <Tabs activeTab={activeTab} onSelect={selectTab} />
      {activeTab === 'list' ? <ListTab /> : <MatrixTab />}
    </main>
  );
}
