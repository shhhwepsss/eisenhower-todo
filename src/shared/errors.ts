import type { LogPayload } from './logger';

/**
 * Ошибка — в нагрузку лога отдельными ключами (CLAUDE.md §9): по `message`
 * запись находится грепом, по `stack` — место падения.
 *
 * Бросить в JavaScript можно что угодно — строку, объект, `undefined`. Такое
 * значение кладётся как есть, а не приводится к строке: `String({})` даёт
 * «[object Object]» и теряет ровно то, ради чего лог и пишется.
 */
export const describeError = (error: unknown): LogPayload => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { thrown: error };
};
