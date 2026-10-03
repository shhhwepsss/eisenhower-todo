import { ISO_UTC } from './constants/iso-utc.constant';
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

export const isTimestamp = (value: unknown): value is string => {
  return typeof value === 'string' && ISO_UTC.test(value);
};
