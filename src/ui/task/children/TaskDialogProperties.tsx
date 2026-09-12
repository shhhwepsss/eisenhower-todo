import { resolveZone } from '@/domain';
import type { Zone } from '@/domain';
import { DeleteButton } from './DeleteButton';
import { PriorityToggles } from './PriorityToggles';
import { StatusSelect } from './StatusSelect';
import { ZONE_LABELS } from '../constants';
import type { TaskProps } from '../types';
import styles from './TaskDialogProperties.module.scss';

/**
 * Правая колонка окна задачи: статус, признаки, квадрант и удаление
 * (issue #40, направление «Панель свойств»).
 *
 * Свойства стоят столбиком на утопленной поверхности, каждое со своей подписью:
 * ряд читается как список полей, а не как россыпь кнопок. Подписи обязательны —
 * «Срочная» и «Важная» рядом со статусом иначе выглядели бы его вариантами.
 *
 * Квадрант показан, но не редактируется (QUADRANT_IS_DERIVED): он следствие
 * пары признаков, и второй контрол, назначающий его напрямую, немедленно
 * разошёлся бы с ними. Менять квадрант можно признаками здесь или
 * перетаскиванием в матрице — способов ровно два, и оба видны.
 *
 * Подпись есть и у удаления: без неё значок корзины стоял бы в столбце
 * подписанных полей единственным неподписанным и читался бы как случайный.
 *
 * Удаление закрывает окно не своими силами: задача уходит из выборок, окно
 * перестаёт находить её по идентификатору и закрывается само (`TaskDialog`).
 * Кнопка про окно ничего не знает и знать не должна.
 */
export const TaskDialogProperties = ({ task }: TaskProps) => {
  const zone: Zone = resolveZone(task);

  return (
    <div className={styles.properties}>
      <div className={styles.field}>
        <span className={styles.label}>Статус</span>
        <StatusSelect task={task} />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Признаки</span>
        <PriorityToggles task={task} />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Квадрант</span>
        <span className={styles.quadrant} data-zone={zone}>
          {ZONE_LABELS[zone]}
        </span>
        <span className={styles.note}>следствие признаков, руками не меняется</span>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Удаление</span>
        <DeleteButton task={task} />
      </div>
    </div>
  );
};
