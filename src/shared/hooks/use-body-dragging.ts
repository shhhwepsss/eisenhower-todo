import { useEffect, useState } from 'react';

import { createLog } from '../logger';
import type { Logger } from '../logger';

const log: Logger = createLog('shared/hooks');

/**
 * Глобальный курсор перетаскивания (docs/specs/35-design-system.md §5,
 * DRAG_CURSOR_GLOBAL). Во время жеста курсор берётся у элемента под
 * указателем — у зоны, у соседней карточки, у фона, — и чтобы он не мигал на
 * границах зон, `body[data-dragging]` перебивает его на уровне документа
 * (`global.scss`).
 *
 * Атрибут ставит эффект, а не сам вызывающий код: прямая правка
 * `document.body` из обработчика `onDragEnd`/`onDragCancel` оставила бы
 * атрибут висеть, если компонент размонтируется посреди жеста, — весь
 * интерфейс замер бы с курсором `grabbing`. Эффект же снимает атрибут и на
 * штатном завершении/отмене (смена `dragging` на `false`), и на размонтировании
 * (та же функция очистки).
 */
export type BodyDragging = {
  startDragging: () => void;
  stopDragging: () => void;
};

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
