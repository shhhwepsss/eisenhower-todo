import { createLog } from '@/shared/logger';
import type { Logger } from '@/shared/logger';

/**
 * Логгер слоя состояния (CLAUDE.md §9). Домен молчит по определению, поэтому
 * «действие ничего не изменило» и «задачи с таким id нет» логирует тот, кто
 * позвал мутацию, — то есть редьюсер.
 */
export const log: Logger = createLog('state');
