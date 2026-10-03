import type { Task, Zone } from '@eisenhower/core';
import type { ZoneMeta } from './zone-meta.type';

export type MatrixZoneProps = {
  zone: Zone;
  meta: ZoneMeta;
  tasks: Task[];
  /** Клик по карточке — открыть окно правки её задачи (issue #40). */
  onOpen: (id: string) => void;
};
