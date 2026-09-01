import type { SettingsRepository, TaskRepository } from './repository';

/**
 * Всё, что слой хранения отдаёт приложению на входе.
 *
 * Флаг `persistent` — не деталь реализации, а то, что придётся сказать
 * пользователю: при `false` задачи живут до перезагрузки вкладки. Без него
 * приложение не отличит рабочее хранилище от запасного и промолчит там,
 * где промолчать нельзя.
 */
export type Repositories = {
  tasks: TaskRepository;
  settings: SettingsRepository;
  persistent: boolean;
};
