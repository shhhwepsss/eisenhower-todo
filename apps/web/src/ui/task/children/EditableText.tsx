import { useTaskActions } from '@/state';
import type { TaskActions } from '@/state';
import type { TaskFieldProps } from '../types';
import styles from './EditableText.module.scss';

/**
 * Описание задачи. Пустое — нормальное состояние, а не незаполненная форма
 * (PRD §3), поэтому здесь нет ни проверки, ни звёздочки обязательности.
 *
 * Правка уезжает в стор по потере фокуса: Enter в описании переводит строку,
 * а не заканчивает ввод.
 */
export const EditableText = ({ task, className }: TaskFieldProps) => {
  const { editText }: TaskActions = useTaskActions();
  const classes: string | undefined =
    className === undefined ? styles.text : `${styles.text} ${className}`;

  const commit = (area: HTMLTextAreaElement): void => {
    const next: string = area.value.trim();
    if (next === task.text) return;
    editText(task.id, next);
  };

  return (
    <textarea
      className={classes}
      rows={1}
      defaultValue={task.text}
      placeholder="Описание"
      aria-label="Описание"
      onBlur={(event) => commit(event.currentTarget)}
    />
  );
};
