import { resolveZone } from '@/domain';
import type { Zone } from '@/domain';
import { DeleteButton } from './children/DeleteButton';
import { EditableText } from './children/EditableText';
import { EditableTitle } from './children/EditableTitle';
import { PriorityToggles } from './children/PriorityToggles';
import { StatusSelect } from './children/StatusSelect';
import { ZONE_LABELS } from './constants';
import type { TaskProps } from './types';
import styles from './TaskRow.module.scss';

/**
 * Строка задачи на вкладке «Список». В отличие от карточки матрицы, здесь задача
 * доступна целиком: список — инвентарь, и всё, что с задачей можно сделать,
 * делается отсюда (PRD §6).
 *
 * Имя строке даёт заголовок задачи, а её контролы называются коротко —
 * различает их та строка, внутри которой они лежат.
 *
 * Зона здесь не видна из раскладки — списка без сетки, поэтому цвет и подпись
 * зоны едут с карточкой (docs/specs/35-design-system.md §3, допущение
 * «явная матрица»): полоса слева и текстовая подпись рядом с ней. Подпись
 * обязательна — цвет один не различает Q1 и Q3 при дейтеранопии (COLOR_NOT_ALONE).
 *
 * У «Входящих» подписи нет: заголовок группы в `ListGroupSection` уже называется
 * «Входящие», и повторять его текстом под полосой у каждой строки — дублирование,
 * найденное на визуальной проверке. Полоса при этом остаётся у всех зон, включая
 * «Входящие»: `inbox` в теме — единственная зона без цветности, так что полоса
 * там нейтрально-серая, а не «скрытая».
 */
export const TaskRow = ({ task }: TaskProps) => {
  const zone: Zone = resolveZone(task);

  return (
    <article className={styles.row} data-zone={zone} aria-label={task.title}>
      {zone !== 'inbox' && <span className={styles.zoneLabel}>{ZONE_LABELS[zone]}</span>}
      <EditableTitle task={task} />
      <EditableText task={task} />
      <div className={styles.controls}>
        <StatusSelect task={task} />
        <PriorityToggles task={task} />
        <DeleteButton task={task} />
      </div>
    </article>
  );
};
