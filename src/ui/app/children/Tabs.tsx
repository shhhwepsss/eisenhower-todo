import { TABS } from '../constants';
import type { TabsProps } from '../types';
import styles from './Tabs.module.scss';

export function Tabs({ activeTab, onSelect }: TabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Представления задач">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`tab-${id}`}
          aria-controls={`panel-${id}`}
          aria-selected={id === activeTab}
          className={id === activeTab ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          onClick={() => onSelect(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
