import type { Task } from '@eisenhower/core';

export type SortableCardProps = {
  task: Task;
  /** Клик по карточке — открыть окно правки этой задачи (issue #40). */
  onOpen: (id: string) => void;
};
