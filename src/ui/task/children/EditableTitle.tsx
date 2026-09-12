import type { KeyboardEvent } from 'react';
import { useTaskActions } from '@/state';
import type { TaskActions } from '@/state';
import type { TaskProps } from '../types';
import styles from './EditableTitle.module.scss';

/**
 * Правка заголовка прямо в строке списка.
 *
 * Поле неуправляемое, и это осознанно: управляемое требовало бы состояния-черновика
 * и его синхронизации с задачей, а править заголовок больше некому — единственный
 * его редактор здесь. Правка уезжает в стор по потере фокуса и по Enter, а не по
 * каждому нажатию: иначе одна фраза дала бы два десятка действий и столько же
 * записей снапшота.
 *
 * Пустой заголовок гасится здесь, а не летит в домен: `normalizeTaskTitle` на нём
 * бросает (TITLE_IS_NOT_EMPTY), и правило спеки §2 — «пустой ввод гасит форма».
 */
export const EditableTitle = ({ task }: TaskProps) => {
  const { editTitle }: TaskActions = useTaskActions();

  const commit = (input: HTMLInputElement): void => {
    const next: string = input.value.trim();
    if (next === '') {
      input.value = task.title;
      return;
    }
    if (next === task.title) return;
    editTitle(task.id, next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') event.currentTarget.blur();
    if (event.key === 'Escape') {
      event.currentTarget.value = task.title;
      event.currentTarget.blur();
    }
  };

  return (
    <input
      className={styles.title}
      type="text"
      defaultValue={task.title}
      aria-label="Заголовок"
      onBlur={(event) => commit(event.currentTarget)}
      onKeyDown={onKeyDown}
    />
  );
};
