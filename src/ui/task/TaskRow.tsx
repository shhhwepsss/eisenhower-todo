import { useState } from 'react';
import type { MouseEvent } from 'react';
import { resolveZone } from '@/domain';
import type { Zone } from '@/domain';
import { createLog } from '@/shared/logger';
import type { Logger } from '@/shared/logger';
import { DeleteButton } from './children/DeleteButton';
import { EditableText } from './children/EditableText';
import { EditableTitle } from './children/EditableTitle';
import { PriorityToggles } from './children/PriorityToggles';
import { StatusSelect } from './children/StatusSelect';
import { UNSORTED_ROW_LABEL, ZONE_LABELS } from './constants';
import type { TaskProps } from './types';
import styles from './TaskRow.module.scss';

const log: Logger = createLog('ui/task');

/** Всё, что само отвечает на клик: по такому попаданию строка не раскрывается. */
const CONTROL_SELECTOR: string = 'button, input, select, textarea, a';

const hitsControl = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false;

  const control: Element | null = target.closest(CONTROL_SELECTOR);
  return control !== null;
};

/**
 * Строка задачи на вкладке «Список». В отличие от карточки матрицы, здесь задача
 * доступна целиком: список — инвентарь, и всё, что с задачей можно сделать,
 * делается отсюда (PRD §6).
 *
 * Имя строке даёт заголовок задачи, а её контролы называются коротко —
 * различает их та строка, внутри которой они лежат.
 *
 * Зона здесь не видна из раскладки — списка без сетки, поэтому цвет и подпись
 * зоны едут с задачей (docs/specs/35-design-system.md §3, допущение «явная
 * матрица»). В части 2 это плашка: заливка зоны, её же текст и подпись внутри.
 * Подпись обязательна — цвет один не различает Q1 и Q3 при дейтеранопии
 * (COLOR_NOT_ALONE).
 *
 * Раскрытие — состояние показа, а не данные задачи: живёт в `useState` строки,
 * никуда не сохраняется и после перезагрузки строка снова собрана. На широком
 * экране контролы видны всегда, и кнопка раскрытия спрятана средствами CSS —
 * `display: none` убирает её и с экрана, и из дерева доступности, поэтому
 * второго условия в разметке не нужно.
 *
 * Раскрывает не только кнопка, но и тап по самой строке — так написан критерий
 * приёмки, и так ведёт себя список на телефоне. Клик по контролу при этом
 * строку не трогает: `hitsControl` отсекает попадания в кнопку, поле и `select`,
 * иначе правка заголовка складывала бы строку под пальцем. Кнопка остаётся
 * ради клавиатуры: у `article` нет ни фокуса, ни `aria-expanded`.
 *
 * Статус в раскрытие не уезжает: в свёрнутой строке он — единственное, что
 * отвечает на вопрос «в работе или нет», и прятать его значило бы прятать
 * состояние задачи.
 */
export const TaskRow = ({ task }: TaskProps) => {
  const zone: Zone = resolveZone(task);
  const zoneLabel: string = zone === 'inbox' ? UNSORTED_ROW_LABEL : ZONE_LABELS[zone];
  const [expanded, setExpanded] = useState<boolean>(false);

  const toggleControls = (): void => {
    log.debug('раскрытие строки списка', { task: task.id, expanded: !expanded });
    setExpanded(!expanded);
  };

  const onRowClick = (event: MouseEvent<HTMLElement>): void => {
    if (hitsControl(event.target)) return;

    toggleControls();
  };

  return (
    <article
      className={styles.row}
      data-zone={zone}
      data-status={task.status}
      data-expanded={expanded}
      aria-label={task.title}
      onClick={onRowClick}
    >
      <span className={styles.zoneCell}>
        <span className={styles.zone}>{zoneLabel}</span>
      </span>

      <div className={styles.body}>
        <EditableTitle task={task} />
        <EditableText task={task} />
      </div>

      <div className={styles.status}>
        <StatusSelect task={task} />
      </div>

      <button
        type="button"
        className={styles.expand}
        aria-label="Действия"
        aria-expanded={expanded}
        onClick={toggleControls}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div className={styles.controls}>
        <PriorityToggles task={task} />
        <DeleteButton task={task} />
      </div>
    </article>
  );
};
