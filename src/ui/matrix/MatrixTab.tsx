import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, SensorDescriptor, SensorOptions } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { QUADRANTS } from '@/domain';
import { useBodyDragging } from '@/shared/hooks/use-body-dragging';
import type { BodyDragging } from '@/shared/hooks/use-body-dragging';
import { useMatrixZones, useTaskActions } from '@/state';
import type { MatrixZones, TaskActions } from '@/state';
import { MatrixZone } from './children/MatrixZone';
import { INBOX_META, QUADRANT_META } from './constants';
import { resolveDrop } from './helpers';
import type { DropTarget } from './helpers';
import styles from './MatrixTab.module.scss';

/**
 * Рабочий экран (PRD §3): «Входящие» стоят рядом с квадрантами, чтобы разбор был
 * одним движением. Выполненные задачи здесь не видны нигде, включая «Входящие», —
 * DONE_LEAVES_MATRIX держится выборками в `state/`, а не фильтром в разметке.
 *
 * Список квадрантов берётся из домена, а не выписывается здесь: порядок Q1..Q4
 * задан одной таблицей на весь проект.
 *
 * Порог в 4 пикселя нужен, чтобы жест не съедал клики: на карточке живут
 * переключатели разбора, и они должны продолжать работать. Клавиатурный сенсор
 * стоит рядом с мышью, потому что перетаскивание — единственный способ вернуть
 * задачу во «Входящие» (спека §12), и оставлять его только для мыши нельзя.
 */
export const MatrixTab = () => {
  const zones: MatrixZones = useMatrixZones();
  const { moveToZone }: TaskActions = useTaskActions();
  const { startDragging, stopDragging }: BodyDragging = useBodyDragging();

  const sensors: SensorDescriptor<SensorOptions>[] = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (): void => {
    startDragging();
  };

  const onDragCancel = (): void => {
    stopDragging();
  };

  const onDragEnd = (event: DragEndEvent): void => {
    stopDragging();

    const { active, over } = event;
    if (over === null) return;

    const target: DropTarget | null = resolveDrop(zones, String(active.id), String(over.id));
    if (target === null) return;

    moveToZone(String(active.id), target.zone, target.between);
  };

  return (
    <section
      className={styles.panel}
      role="tabpanel"
      id="panel-matrix"
      aria-labelledby="tab-matrix"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragCancel={onDragCancel}
        onDragEnd={onDragEnd}
      >
        <div className={styles.board}>
          <MatrixZone zone="inbox" meta={INBOX_META} tasks={zones.inbox} />
          <div className={styles.quadrants}>
            {QUADRANTS.map((quadrant) => (
              <MatrixZone
                key={quadrant}
                zone={quadrant}
                meta={QUADRANT_META[quadrant]}
                tasks={zones[quadrant]}
              />
            ))}
          </div>
        </div>
      </DndContext>
    </section>
  );
};
