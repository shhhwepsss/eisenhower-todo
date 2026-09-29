import type { TabId } from './tab-id';

/**
 * Меню видно всегда — бренд и переключатель темы доступны и на экране загрузки,
 * и при отказе хранилища. А вот сами вкладки монтируются только тогда, когда
 * задачи есть с чем показывать: при `loading` и `unavailable` списка вкладок
 * на экране нет вовсе (см. `App`).
 */
export type AppMenuProps = {
  activeTab: TabId;
  onSelect: (tab: TabId) => void;
  showTabs: boolean;
};
