import type { MouseEvent } from 'react';
import { resolveZone } from '@/domain';
import type { Zone } from '@/domain';
import { hitsControl } from '@/shared/dom/control-hit';
import { StatusSelect } from './children/StatusSelect';
import { UNSORTED_ROW_LABEL, ZONE_LABELS } from './constants';
import type { TaskRowProps } from './types';
import styles from './TaskRow.module.scss';

/**
 * Строка задачи на вкладке «Список» — представление, а не форма (issue #40,
 * ONE_EDIT_SURFACE). Строка отвечает на вопрос «что это за задача и в каком она
 * состоянии», а правка целиком живёт в окне, которое открывается кликом по ней.
 *
 * Что отсюда уехало в окно: правка заголовка и описания, признаки разбора и
 * удаление. Раскрытие строки уехало вместе с ними — раскрывать стало нечего,
 * и одному клику незачем значить сразу две вещи.
 *
 * Статус остался: он не правка задачи, а отметка хода работы, и в свёрнутом
 * инвентаре — единственное, что отвечает «в работе или нет». Прятать его за
 * окном значило бы прятать состояние. Клик по нему окна не открывает
 * (CONTROLS_KEEP_THEIR_PRESS).
 *
 * CONTROLS_REACHABLE_MOBILE держится теперь окном, а не раскрытием: на узком
 * экране все контролы задачи доступны там же, куда ведёт тап по строке,
 * и ничего больше не прячется за отдельной кнопкой.
 *
 * Имя строке даёт заголовок задачи. Зона здесь не видна из раскладки — списка
 * без сетки, поэтому цвет и подпись зоны едут с задачей
 * (docs/specs/35-design-system.md §3, допущение «явная матрица»). Подпись
 * обязательна — цвет один не различает Q1 и Q3 при дейтеранопии (COLOR_NOT_ALONE).
 */
export const TaskRow = ({ task, onOpen }: TaskRowProps) => {
  const zone: Zone = resolveZone(task);
  const zoneLabel: string = zone === 'inbox' ? UNSORTED_ROW_LABEL : ZONE_LABELS[zone];

  const onRowClick = (event: MouseEvent<HTMLElement>): void => {
    if (hitsControl(event.target)) return;

    onOpen(task.id);
  };

  return (
    <article
      className={styles.row}
      data-zone={zone}
      data-status={task.status}
      aria-label={task.title}
      onClick={onRowClick}
    >
      <span className={styles.zoneCell}>
        <span className={styles.zone}>{zoneLabel}</span>
      </span>

      <div className={styles.body}>
        <h3 className={styles.title}>{task.title}</h3>
        {task.text === '' ? null : <p className={styles.text}>{task.text}</p>}
      </div>

      <div className={styles.status}>
        <StatusSelect task={task} />
      </div>
    </article>
  );
};
