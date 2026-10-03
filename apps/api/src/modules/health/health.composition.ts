import { BUILD_VERSION } from '../../constants/build-version.constant';
import type { AppDeps, DatabaseProbe, Env } from '../../types';
import { CheckHealthUseCase } from './check-health.use-case';
import { HealthController } from './health.controller';
import { DatabaseHealthService } from './services/database-health.service';

/**
 * Регистрация сервисов модуля health (docs/specs/60-api-modules.md): единственное место,
 * где его слои собираются друг из друга — внешняя интеграция → сервис → use-case →
 * контроллер. Обычные конструкторы, без контейнера.
 *
 * Собирается на запрос, а не при старте: адрес базы известен только после разбора
 * окружения, а он происходит на запросе (ENV_FAILS_FAST). Объекты ничего не держат, и
 * между запросами в памяти ничего не остаётся (docs/specs/50-api-skeleton.md).
 */
export const composeHealthController = (deps: AppDeps, env: Env): HealthController => {
  const probe: DatabaseProbe = deps.createDatabaseProbe(env);
  const databaseHealth: DatabaseHealthService = new DatabaseHealthService(probe);
  const checkHealth: CheckHealthUseCase = new CheckHealthUseCase(databaseHealth, BUILD_VERSION);
  return new HealthController(checkHealth);
};
