import type { TabId } from './tab-id.type';

export type ActiveTab = {
  activeTab: TabId;
  selectTab: (tab: TabId) => void;
};
