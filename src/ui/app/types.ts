export type TabId = 'list' | 'matrix';

export type TabsProps = {
  activeTab: TabId;
  onSelect: (tab: TabId) => void;
};

export type ActiveTab = {
  activeTab: TabId;
  selectTab: (tab: TabId) => void;
};
