import type { DatabaseFailure } from '../../../types';

/**
 * Итог сценария «проверить здоровье» — то, что use-case отдаёт контроллеру
 * (docs/specs/60-api-modules.md). Об HTTP здесь ничего: код ответа и тело выбирает
 * контроллер.
 *
 * `cause` — только для лога: в ответ клиенту текст ошибки базы не попадает
 * (DATABASE_FAILURE_IS_REPORTED).
 */
export type HealthReport =
  | { healthy: true; version: string }
  | { healthy: false; version: string; reason: DatabaseFailure; cause: unknown };
