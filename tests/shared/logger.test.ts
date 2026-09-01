import type { MockInstance } from 'vitest';

import { Log, createLog, getLogLevel, setLogLevel } from '@/shared/logger';
import type { LogLevel, Logger } from '@/shared/logger';

const LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'];

/** Время в префиксе меняется от запуска к запуску, поэтому сверяется формой. */
const TIME: string = String.raw`\[\d{2}:\d{2}:\d{2}\.\d{3}\]`;

const linePattern = (level: LogLevel, scope: string, message: string): RegExp => {
  const tags: string = String.raw`\[${level}\] \[${scope}\]`;
  return new RegExp(`^${TIME} ${tags} ${message}$`);
};

describe('logger', () => {
  let initial: LogLevel;

  beforeEach(() => {
    initial = getLogLevel();
    setLogLevel('debug');
  });

  afterEach(() => {
    setLogLevel(initial);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each(LEVELS)('%s пишет в одноимённый метод консоли с областью в префиксе', (level) => {
    const spy: MockInstance = vi.spyOn(console, level).mockImplementation(() => {});

    createLog('storage')[level]('снапшот прочитан');

    const pattern: RegExp = linePattern(level, 'storage', 'снапшот прочитан');
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(pattern));
  });

  it('префикс — время, уровень и область в фиксированном порядке', () => {
    const spy: MockInstance = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 31, 12, 3, 41, 220));

    createLog('storage').warn('снапшот повреждён');

    expect(spy).toHaveBeenCalledWith('[12:03:41.220] [warn] [storage] снапшот повреждён');
  });

  it('нагрузка передаётся отдельным аргументом, а не склеивается в строку', () => {
    const spy: MockInstance = vi.spyOn(console, 'info').mockImplementation(() => {});

    createLog('ui/app').info('переключение вкладки', { from: 'list', to: 'matrix' });

    const pattern: RegExp = linePattern('info', 'ui/app', 'переключение вкладки');
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(pattern), {
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

    const pattern: RegExp = linePattern('warn', 'app', 'без своей области');
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(pattern));
  });
});
