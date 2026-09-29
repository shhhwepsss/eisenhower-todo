import { useState } from 'react';
import { createLog } from '@/shared/logger';
import type { Logger } from '@/shared/logger';

const log: Logger = createLog('ui/task');

export type TaskDialogState = {
  /** Идентификатор задачи, чьё окно открыто, либо `null`. */
  openTaskId: string | null;
  open(id: string): void;
  close(): void;
};

/**
 * Какая задача открыта в окне правки (issue #40).
 *
 * Хук, а не контекст: на экране одна вкладка, и состояние показа нужно ровно
 * одному экрану за раз. Контекст сделал бы «какая задача открыта» свойством
 * всего приложения — и окно пережило бы переключение вкладки, чего быть
 * не должно (спека §Допущения).
 *
 * Хранится идентификатор, а не задача: пока окно открыто, задачу меняют прямо
 * в нём, и снимок на момент открытия показывал бы старое название рядом с новым.
 * Задачу по идентификатору находит вызывающий экран — он и так держит выборку.
 *
 * Следствие, названное заранее: удалённая задача из выборок уходит, и
 * `openTaskId` остаётся указывать в пустоту. Это безвредно — «открыто» считается
 * по найденной задаче, а не по идентификатору, поэтому окно закрывается само,
 * а следующий `open` затирает остаток.
 */
export const useTaskDialog = (): TaskDialogState => {
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const open = (id: string): void => {
    log.info('открыто окно задачи', { task: id });
    setOpenTaskId(id);
  };

  const close = (): void => {
    log.debug('закрыто окно задачи', { task: openTaskId });
    setOpenTaskId(null);
  };

  return { openTaskId, open, close };
};
