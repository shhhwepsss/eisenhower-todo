import { useState } from 'react';
import { ListTab } from '../list/ListTab';
import { MatrixTab } from '../matrix/MatrixTab';
import { Tabs, type TabId } from './tabs';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('list');

  return (
    <main className="app">
      <h1 className="app__title">Eisenhower Todo</h1>
      <Tabs activeTab={activeTab} onSelect={setActiveTab} />
      {activeTab === 'list' ? <ListTab /> : <MatrixTab />}
    </main>
  );
}
