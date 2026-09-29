import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTaskActions } from '@/state';
import type { TaskActions } from '@/state';
import styles from './TaskForm.module.scss';

/**
 * Быстрый захват (PRD S1): фокус, строка, Enter — три действия, и ни разметки,
 * ни описания на этом шаге не требуется. Задача рождается неразобранной
 * и попадает во «Входящие» — MANUAL_PRIORITISATION.
 *
 * Пустой ввод гасится здесь, а не в домене: `normalizeTaskTitle` на нём бросает
 * (TITLE_IS_NOT_EMPTY), и правило спеки §2 — «пустой ввод гасит форма».
 */
export const TaskForm = () => {
  const { addTask }: TaskActions = useTaskActions();
  const [title, setTitle] = useState<string>('');

  const trimmed: string = title.trim();

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (trimmed === '') return;
    addTask(trimmed);
    setTitle('');
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <input
        className={styles.input}
        type="text"
        value={title}
        placeholder="Что нужно сделать?"
        aria-label="Новая задача"
        onChange={(event) => setTitle(event.target.value)}
      />
      <button className={styles.submit} type="submit" disabled={trimmed === ''}>
        Добавить
      </button>
    </form>
  );
};
