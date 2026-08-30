import type { TabId } from './tab-id';

export type ActiveTab = {
  activeTab: TabId;
  selectTab: (tab: TabId) => void;
};
