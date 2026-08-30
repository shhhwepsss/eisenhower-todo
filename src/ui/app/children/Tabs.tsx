import type { TabId, TabsProps } from '../types';

const TABS: readonly { id: TabId; label: string }[] = [
  { id: 'list', label: 'Список' },
  { id: 'matrix', label: 'Матрица' },
];

export function Tabs({ activeTab, onSelect }: TabsProps) {
  return (
    <div className="tabs" role="tablist" aria-label="Представления задач">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`tab-${id}`}
          aria-controls={`panel-${id}`}
          aria-selected={id === activeTab}
          className={id === activeTab ? 'tab tab--active' : 'tab'}
          onClick={() => onSelect(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
