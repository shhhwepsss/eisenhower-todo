import type { GroupMeta } from './group-meta.type';

export type ListGroupSectionProps = {
  meta: GroupMeta;
  /** Клик по строке — открыть окно правки её задачи (issue #40). */
  onOpen: (id: string) => void;
};
