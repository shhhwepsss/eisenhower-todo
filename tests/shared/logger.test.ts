import type { MockInstance } from 'vitest';

import { Log, createLog, getLogLevel, setLogLevel } from '@/shared/logger';
import type { LogLevel, Logger } from '@/shared/logger';

const LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'];

describe('logger', () => {
  let initial: LogLevel;

  beforeEach(() => {
    initial = getLogLevel();
    setLogLevel('debug');
  });

  afterEach(() => {
    setLogLevel(initial);
    vi.restoreAllMocks();
  });

  it.each(LEVELS)('%s пишет в одноимённый метод консоли с областью в префиксе', (level) => {
    const spy: MockInstance = vi.spyOn(console, level).mockImplementation(() => {});

    createLog('storage')[level]('снапшот прочитан');

    expect(spy).toHaveBeenCalledWith('[storage] снапшот прочитан');
  });

  it('нагрузка передаётся отдельным аргументом, а не склеивается в строку', () => {
    const spy: MockInstance = vi.spyOn(console, 'info').mockImplementation(() => {});

    createLog('ui/app').info('переключение вкладки', { from: 'list', to: 'matrix' });

    expect(spy).toHaveBeenCalledWith('[ui/app] переключение вкладки', {
      from: 'list',
      to: 'matrix',
    });
  });

  it('порог отсекает всё, что ниже уровнем', () => {
    const debug: MockInstance = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const info: MockInstance = vi.spyOn(console, 'info').mockImplementation(() => {});
    const error: MockInstance = vi.spyOn(console, 'error').mockImplementation(() => {});

    setLogLevel('info');
    const log: Logger = createLog('domain');
    log.debug('не должно попасть');
    log.info('должно попасть');
    log.error('должно попасть');

    expect(debug).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledOnce();
  });

  it('Log — логгер по умолчанию с областью app', () => {
    const spy: MockInstance = vi.spyOn(console, 'warn').mockImplementation(() => {});

    Log.warn('без своей области');

    expect(spy).toHaveBeenCalledWith('[app] без своей области');
  });
});
