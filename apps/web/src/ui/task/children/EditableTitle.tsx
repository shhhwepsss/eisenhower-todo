import type { KeyboardEvent } from 'react';
import { useTaskActions } from '@/state';
import type { TaskActions } from '@/state';
import type { TaskFieldProps } from '../types';
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
 *
 * Escape правку не откатывает (issue #40). Поле теперь живёт и в окне задачи,
 * где Escape означает «закрыть окно», и закрытие обязано сохранить введённое
 * (NO_LOST_EDIT). Один и тот же ключ не может значить в одном поле и «отменить»,
 * и «сохранить и уйти», поэтому отмена убрана, а не выбрана по месту показа.
 */
export const EditableTitle = ({ task, className }: TaskFieldProps) => {
  const { editTitle }: TaskActions = useTaskActions();
  const classes: string | undefined =
    className === undefined ? styles.title : `${styles.title} ${className}`;

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
    if (event.key !== 'Enter') return;
    event.currentTarget.blur();
  };

  return (
    <input
      className={classes}
      type="text"
      defaultValue={task.title}
      aria-label="Заголовок"
      onBlur={(event) => commit(event.currentTarget)}
      onKeyDown={onKeyDown}
    />
  );
};
