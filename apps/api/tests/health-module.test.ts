import { CheckHealthUseCase } from '../src/modules/health/check-health.use-case';
import { DatabaseHealthService } from '../src/modules/health/services/database-health.service';
import type { HealthReport } from '../src/modules/health/types';
import type { DatabaseCheck, DatabaseProbe } from '../src/types';

/**
 * Слои модуля health ниже контроллера (docs/specs/60-api-modules.md): собираются и
 * проверяются без Hono и без запроса. Ответ ручки целиком — в `app.test.ts`.
 */
const VERSION: string = 'abc1234';

const createUseCase = (check: () => Promise<DatabaseCheck>): CheckHealthUseCase => {
  const probe: DatabaseProbe = { check };
  const databaseHealth: DatabaseHealthService = new DatabaseHealthService(probe);
  return new CheckHealthUseCase(databaseHealth, VERSION);
};

describe('CheckHealthUseCase', () => {
  it('база в порядке — отчёт healthy с версией сборки', async () => {
    const useCase: CheckHealthUseCase = createUseCase(async () => ({ ok: true }));

    const report: HealthReport = await useCase.execute();

    expect(report).toEqual({ healthy: true, version: VERSION });
  });

  it('проверка базы не прошла — в отчёте причина и исходная ошибка', async () => {
    const cause: Error = new Error('база не ответила за 10000 мс');
    const useCase: CheckHealthUseCase = createUseCase(async () => {
      return { ok: false, reason: 'database_unavailable', cause };
    });

    const report: HealthReport = await useCase.execute();

    expect(report).toEqual({ healthy: false, version: VERSION, reason: 'database_unavailable', cause });
  });

  it('сбой базы — значение: use-case не пишет лог, это дело контроллера', async () => {
    const cause: Error = new Error('в журнале базы нет последней миграции кода');
    const useCase: CheckHealthUseCase = createUseCase(async () => {
      return { ok: false, reason: 'schema_behind', cause };
    });
    const consoleError: ReturnType<typeof vi.spyOn> = vi.spyOn(console, 'error').mockImplementation(() => {});

    await useCase.execute();

    expect(consoleError).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('проверка идёт на каждом вызове: ни сервис, ни use-case ничего не помнят', async () => {
    const check: () => Promise<DatabaseCheck> = vi.fn(async (): Promise<DatabaseCheck> => ({ ok: true }));
    const useCase: CheckHealthUseCase = createUseCase(check);

    await useCase.execute();
    await useCase.execute();

    expect(check).toHaveBeenCalledTimes(2);
  });
});
