import type { DatabaseCheck } from '../../types';
import { toHealthReport } from './mappers/health-report.mapper';
import type { DatabaseHealthService } from './services/database-health.service';
import type { HealthReport } from './types';

/**
 * Сценарий «проверить здоровье»: версия сборки и состояние базы
 * (docs/specs/60-api-modules.md). Об HTTP и Hono не знает — отдаёт `HealthReport`, а код
 * ответа и тело выбирает контроллер. Форму `HealthReport` собирает маппер, а не сценарий
 * (CLAUDE.md §8).
 *
 * Сбой базы — значение, а не исключение, и лог здесь не пишется: его пишет тот, кто
 * отвечает на запрос (CLAUDE.md §9).
 */
export class CheckHealthUseCase {
  private readonly databaseHealth: DatabaseHealthService;
  private readonly version: string;

  constructor(databaseHealth: DatabaseHealthService, version: string) {
    this.databaseHealth = databaseHealth;
    this.version = version;
  }

  public async execute(): Promise<HealthReport> {
    const check: DatabaseCheck = await this.databaseHealth.check();
    return toHealthReport(check, this.version);
  }
}
