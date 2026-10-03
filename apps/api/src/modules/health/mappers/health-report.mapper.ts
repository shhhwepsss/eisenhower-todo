import type { DatabaseCheck } from '../../../types';
import type { HealthReport } from '../types';

/**
 * Маппер границы «внешняя интеграция → use-case» (docs/specs/60-api-modules.md): итог
 * проверки базы становится итогом сценария. Версию сборки даёт use-case — у базы её нет.
 *
 * `cause` переносится: он нужен логу. В ответ его не пускает следующий маппер —
 * `toHealthBody`.
 */
export const toHealthReport = (check: DatabaseCheck, version: string): HealthReport => {
  if (check.ok) return { healthy: true, version };
  return { healthy: false, version, reason: check.reason, cause: check.cause };
};
