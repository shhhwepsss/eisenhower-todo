import type { Task } from '@/domain';
import { TaskCard } from '@/ui/task';
import { DragGrip } from './DragGrip';
import styles from './DragPreview.module.scss';

/**
 * Копия карточки, которая летит за указателем внутри `DragOverlay`
 * (issue #38, DRAG_IS_VISIBLE).
 *
 * Копия, а не сама карточка: `useSortable` отдаёт карточке сортировочное
 * смещение внутри её же `SortableContext`, и стоит указателю уйти на другую
 * зону, смещение становится `null` — карточка замирала в своём боксе, хотя
 * жест шёл. `DragOverlay` живёт в `position: fixed` у корня контекста, поэтому
 * копии границы зоны не мешают.
 *
 * `aria-hidden`, потому что в копии те же `<select>` и флажки с теми же
 * подписями: без этого на время жеста в дереве доступности оказывались бы два
 * контрола «Статус» у одной задачи. Читать экранным диктором нужно исходную
 * карточку — она и остаётся видимой.
 */
export const DragPreview = ({ task }: { task: Task }) => {
  return (
    <div className={styles.preview} aria-hidden="true">
      <TaskCard task={task} handle={<DragGrip />} />
    </div>
  );
};
