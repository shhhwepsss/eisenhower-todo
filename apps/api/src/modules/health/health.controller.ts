import type { Context } from 'hono';
import { createLog } from '../../logger';
import type { AppEnv, Logger } from '../../types';
import type { CheckHealthUseCase } from './check-health.use-case';
import { toHealthBody } from './mappers/health-body.mapper';
import type { HealthBody, HealthReport } from './types';

const log: Logger = createLog('api/health');

/**
 * HTTP-граница модуля health (docs/specs/60-api-modules.md): переводит итог сценария в
 * код ответа и тело. `Context` Hono дальше контроллера не уходит (HTTP_STAYS_AT_EDGE).
 * Тело собирает маппер `toHealthBody`, код ответа выбирается здесь.
 *
 * DATABASE_FAILURE_IS_REPORTED (docs/specs/51-db-migrations.md): `/api/health` отвечает
 * `200`, только если функция достаёт до базы и в ней применена последняя миграция кода.
 * Причина сбоя уходит в `status`, ошибка базы — в лог: текст ошибки Postgres раскрывает
 * схему. Лог пишется здесь, потому что здесь сбой и обработан (CLAUDE.md §9).
 */
export class HealthController {
  private readonly checkHealth: CheckHealthUseCase;

  constructor(checkHealth: CheckHealthUseCase) {
    this.checkHealth = checkHealth;
  }

  public async check(context: Context<AppEnv>): Promise<Response> {
    const report: HealthReport = await this.checkHealth.execute();
    const body: HealthBody = toHealthBody(report);
    if (report.healthy) return context.json(body);
    log.error('проверка базы не прошла', { reason: report.reason, error: report.cause });
    return context.json(body, 500);
  }
}
