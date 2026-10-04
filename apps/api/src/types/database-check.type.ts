import type { DatabaseFailure } from './database-failure.type';

/**
 * Итог проверки базы. Ошибка — значение, как и у разбора окружения: её обрабатывает
 * тот, кто отвечает на запрос, и он же пишет лог (CLAUDE.md §9).
 *
 * `cause` — только для лога: в ответ клиенту текст ошибки базы не попадает.
 */
export type DatabaseCheck = { ok: true } | { ok: false; reason: DatabaseFailure; cause: unknown };
