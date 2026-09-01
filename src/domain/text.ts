/**
 * Заголовок задачи — непустая после trim строка (docs/specs/4-architecture.md §2).
 *
 * Проверка живёт в домене, потому что домен — единственная дверь в `Task`.
 * Следствие для UI: пустой ввод гасит форма, а не ловит это исключение.
 */
export const normalizeTaskTitle = (raw: string): string => {
  const title: string = raw.trim();
  if (title === '') throw new Error('TITLE_IS_NOT_EMPTY: заголовок задачи не может быть пустым');
  return title;
};

/**
 * Описание задачи. Пустое — нормальное состояние: у большинства задач описания
 * нет, поэтому здесь только обрезка краёв, без отказа.
 */
export const normalizeTaskText = (raw: string): string => {
  return raw.trim();
};
