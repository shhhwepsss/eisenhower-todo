import { useEffect, useState } from 'react';

import { createLog } from '../logger';
import type { Logger } from '../types';
import type { BodyDragging } from '../types';

const log: Logger = createLog('shared/hooks');

export const useBodyDragging = (): BodyDragging => {
  const [dragging, setDragging] = useState<boolean>(false);

  useEffect(() => {
    if (!dragging) return;

    document.body.setAttribute('data-dragging', 'true');
    log.debug('курсор перетаскивания включён');

    return (): void => {
      document.body.removeAttribute('data-dragging');
      log.debug('курсор перетаскивания выключен');
    };
  }, [dragging]);

  const startDragging = (): void => setDragging(true);
  const stopDragging = (): void => setDragging(false);

  return { startDragging, stopDragging };
};
