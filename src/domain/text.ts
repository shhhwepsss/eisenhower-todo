/**
 * Текст задачи — непустая после trim строка (docs/specs/4-architecture.md §2).
 * Проверка живёт в домене, потому что домен — единственная дверь в `Task`.
 */
export function normalizeText(raw: string): string {
  const text = raw.trim();
  if (text === '') throw new Error('TEXT_IS_NOT_EMPTY: текст задачи не может быть пустым');
  return text;
}
