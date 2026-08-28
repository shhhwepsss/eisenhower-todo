import { ListTab } from '../list/ListTab';
import { MatrixTab } from '../matrix/MatrixTab';
import { Tabs } from './tabs';
import { useActiveTab } from './use-active-tab';

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
