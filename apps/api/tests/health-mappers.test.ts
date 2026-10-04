import { toHealthBody } from '../src/modules/health/mappers/health-body.mapper';
import { toHealthReport } from '../src/modules/health/mappers/health-report.mapper';
import type { HealthBody, HealthReport } from '../src/modules/health/types';
import type { DatabaseCheck } from '../src/types';

/**
 * Мапперы модуля health (docs/specs/60-api-modules.md, CLAUDE.md §8): чистые функции,
 * проверяются значением на входе и значением на выходе — без Hono, сервисов и лога.
 */
const VERSION: string = 'abc1234';

const DATABASE_ERROR: string = 'relation "app_meta" does not exist';

describe('toHealthReport: внешняя интеграция → use-case', () => {
  it('база в порядке — отчёт healthy с версией сборки', () => {
    const check: DatabaseCheck = { ok: true };

    const report: HealthReport = toHealthReport(check, VERSION);

    expect(report).toEqual({ healthy: true, version: VERSION });
  });

  it('проверка не прошла — причина и исходная ошибка переносятся в отчёт', () => {
    const cause: Error = new Error(DATABASE_ERROR);
    const check: DatabaseCheck = { ok: false, reason: 'database_unavailable', cause };

    const report: HealthReport = toHealthReport(check, VERSION);

    expect(report).toEqual({ healthy: false, version: VERSION, reason: 'database_unavailable', cause });
  });

  it('полей интеграции в отчёте нет: `ok` остаётся по ту сторону границы', () => {
    const check: DatabaseCheck = { ok: false, reason: 'schema_behind', cause: null };

    const report: HealthReport = toHealthReport(check, VERSION);

    expect(report).not.toHaveProperty('ok');
  });
});

describe('toHealthBody: use-case → HTTP', () => {
  it('отчёт healthy — статус ok и версия', () => {
    const report: HealthReport = { healthy: true, version: VERSION };

    const body: HealthBody = toHealthBody(report);

    expect(body).toEqual({ status: 'ok', version: VERSION });
  });

  it('сбой — статусом становится причина', () => {
    const report: HealthReport = { healthy: false, version: VERSION, reason: 'schema_behind', cause: null };

    const body: HealthBody = toHealthBody(report);

    expect(body).toEqual({ status: 'schema_behind', version: VERSION });
  });

  it('DATABASE_FAILURE_IS_REPORTED: `cause` в тело не попадает — ни полем, ни текстом', () => {
    const cause: Error = new Error(DATABASE_ERROR);
    const report: HealthReport = { healthy: false, version: VERSION, reason: 'database_unavailable', cause };

    const body: HealthBody = toHealthBody(report);
    const keys: string[] = Object.keys(body);
    const text: string = JSON.stringify(body);

    expect(keys).toEqual(['status', 'version']);
    expect(body).not.toHaveProperty('cause');
    expect(text).not.toContain('app_meta');
  });

  it('полей сценария в теле нет: `healthy` и `reason` остаются по ту сторону границы', () => {
    const report: HealthReport = { healthy: false, version: VERSION, reason: 'schema_behind', cause: null };

    const body: HealthBody = toHealthBody(report);

    expect(body).not.toHaveProperty('healthy');
    expect(body).not.toHaveProperty('reason');
  });
});
