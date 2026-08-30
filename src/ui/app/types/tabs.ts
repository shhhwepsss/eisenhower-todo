import type { TabId } from './tab-id';

export type TabsProps = {
  activeTab: TabId;
  onSelect: (tab: TabId) => void;
};
