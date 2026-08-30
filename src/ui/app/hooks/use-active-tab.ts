import { useCallback, useState } from 'react';
import { DEFAULT_TAB } from '../constants';
import type { ActiveTab, TabId } from '../types';

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
