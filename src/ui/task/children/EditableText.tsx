import { useTaskActions } from '@/state';
import type { TaskActions } from '@/state';
import type { TaskProps } from '../types';
import styles from './EditableText.module.scss';

/**
 * Описание задачи. Пустое — нормальное состояние, а не незаполненная форма
 * (PRD §3), поэтому здесь нет ни проверки, ни звёздочки обязательности.
 *
 * Правка уезжает в стор по потере фокуса: Enter в описании переводит строку,
 * а не заканчивает ввод.
 */
export const EditableText = ({ task }: TaskProps) => {
  const { editText }: TaskActions = useTaskActions();

  const commit = (area: HTMLTextAreaElement): void => {
    const next: string = area.value.trim();
    if (next === task.text) return;
    editText(task.id, next);
  };

  return (
    <textarea
      className={styles.text}
      rows={1}
      defaultValue={task.text}
      placeholder="Описание"
      aria-label="Описание"
      onBlur={(event) => commit(event.currentTarget)}
    />
  );
};
