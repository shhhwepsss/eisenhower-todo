import type { HealthBody, HealthReport } from '../types';

/**
 * Маппер границы «use-case → HTTP» (docs/specs/60-api-modules.md): в тело ответа идут
 * статус и версия. `cause` сюда не переносится — текст ошибки Postgres раскрывает схему
 * (DATABASE_FAILURE_IS_REPORTED, docs/specs/51-db-migrations.md).
 *
 * Код ответа маппер не выбирает: это решение контроллера.
 */
export const toHealthBody = (report: HealthReport): HealthBody => {
  const status: HealthBody['status'] = report.healthy ? 'ok' : report.reason;
  return { status, version: report.version };
};
