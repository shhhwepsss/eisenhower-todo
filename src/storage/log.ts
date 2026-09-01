import { createLog } from '@/shared/logger';
import type { Logger } from '@/shared/logger';

/**
 * Логгер слоя хранения (CLAUDE.md §9). Один на слой, а не по одному на модуль:
 * область — это то, по чему фильтруется консоль, и держать её строку в трёх
 * местах значит однажды переименовать её в двух.
 */
export const log: Logger = createLog('storage');
