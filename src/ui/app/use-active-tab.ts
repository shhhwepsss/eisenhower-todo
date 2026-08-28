import { useCallback, useState } from 'react';
import type { TabId } from './tabs';

const DEFAULT_TAB: TabId = 'list';

export type ActiveTab = {
  activeTab: TabId;
  selectTab: (tab: TabId) => void;
};

/**
 * Выбранная вкладка — состояние представления, а не данные задачи: в модели её нет
 * (docs/specs/4-architecture.md §2, UiSettings = { listSort }), поэтому она не персистится
 * и после перезагрузки открывается вкладка по умолчанию.
 */
export function useActiveTab(): ActiveTab {
  const [activeTab, setActiveTab] = useState<TabId>(DEFAULT_TAB);

  const selectTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  return { activeTab, selectTab };
}
