import { useState } from 'react';
import { createLog } from '@/shared/logger';
import { DEFAULT_TAB } from '../constants';
import type { ActiveTab, TabId } from '../types';

const log = createLog('ui/app');

/**
 * Выбранная вкладка — состояние представления, а не данные задачи: в модели её нет
 * (docs/specs/4-architecture.md §2, UiSettings = { listSort }), поэтому она не персистится
 * и после перезагрузки открывается вкладка по умолчанию.
 *
 * Ручной мемоизации здесь нет: этим занимается React Compiler, а setState стабилен
 * между рендерами по контракту React (CLAUDE.md §7).
 */
export function useActiveTab(): ActiveTab {
  const [activeTab, setActiveTab] = useState<TabId>(DEFAULT_TAB);

  function selectTab(tab: TabId): void {
    if (tab === activeTab) {
      log.debug('вкладка уже выбрана, ничего не делаем', { tab });
      return;
    }
    log.info('переключение вкладки', { from: activeTab, to: tab });
    setActiveTab(tab);
  }

  return { activeTab, selectTab };
}
