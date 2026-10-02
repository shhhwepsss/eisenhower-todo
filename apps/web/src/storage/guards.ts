/**
 * Проверки формы для данных, пришедших из хранилища (SNAPSHOT_SHAPE_IS_CHECKED).
 *
 * Живут отдельным модулем, потому что нужны обеим половинам разбора: конверту
 * (envelope.ts) и содержимому (decode.ts). Библиотеки схем здесь нет сознательно —
 * проверяемых форм две, а зависимость приезжает навсегда (CLAUDE.md §10).
 */

/** Объект, а не массив и не `null`: `typeof null === 'object'` — ловушка на ровном месте. */
export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/** Строка, в которой что-то есть: `id`, `title` и `rank` пустыми не бывают. */
export const isFilledString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim() !== '';
};

/**
 * Ровно то, что отдаёт `Date.prototype.toISOString()` — единственный источник
 * времени в проекте (docs/specs/4-architecture.md §2).
 *
 * Проверка строгая, а не `Date.parse`, потому что порядок задач во «Входящих»
 * и в списке — это лексикографическое сравнение этих строк. `Date.parse` примет
 * «2026» и «Jan 1 2026», после чего сортировка тихо разъедется.
 */
const ISO_UTC: RegExp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export const isTimestamp = (value: unknown): value is string => {
  return typeof value === 'string' && ISO_UTC.test(value);
};
