/**
 * Логирование приложения (CLAUDE.md §9).
 *
 * Четыре уровня, один формат, один порог. Логгер живёт в `shared/`, потому что
 * доменного смысла в нём нет, и им пользуются все слои, кроме `domain/`:
 * доменные функции остаются чистыми, а «почему домен решил ничего не делать»
 * логирует вызывающая сторона, сравнив ссылку до и после.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Структурированная нагрузка: ищется грепом по ключам, а не по склейке строк. */
export type LogPayload = Record<string, unknown>;

export type Logger = {
  /** Подробности хода выполнения: что с чем сравнили, почему свернули в no-op. */
  debug(message: string, payload?: LogPayload): void;
  /** Заметные события: старт приложения, применённое действие пользователя. */
  info(message: string, payload?: LogPayload): void;
  /** Пережитая аномалия: данные починены дефолтом, работа продолжается. */
  warn(message: string, payload?: LogPayload): void;
  /** Операция не выполнена: исключение, отказ хранилища. */
  error(message: string, payload?: LogPayload): void;
};

const SEVERITY: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/**
 * В разработке видно всё, в проде — только то, что требует внимания.
 * Порог глобальный и меняется на лету: `setLogLevel` нужен и тестам,
 * и отладке прода без пересборки.
 */
let threshold: LogLevel = import.meta.env.DEV ? 'debug' : 'warn';

export const setLogLevel = (level: LogLevel): void => {
  threshold = level;
};

export const getLogLevel = (): LogLevel => threshold;

/**
 * Локальное время с миллисекундами: по нему видно, что за чем шло и сколько
 * между этим прошло. Дата не пишется — вкладка живёт минуты, а не дни.
 */
const formatTime = (now: Date): string => {
  const clock: string = now.toTimeString().slice(0, 8);
  const millis: number = now.getMilliseconds();
  return `${clock}.${String(millis).padStart(3, '0')}`;
};

/**
 * Имена уровней намеренно совпадают с методами консоли, и метод берётся в момент
 * записи, а не при загрузке модуля: иначе логгер держал бы ссылку на исходный
 * `console` и не заметил бы его подмены — ни в тестах, ни при перехвате логов.
 *
 * Время и уровень стоят в самой строке, а не только в оформлении консоли:
 * скопированная строка лога должна отвечать «когда» и «насколько плохо»
 * без исходной вкладки devtools.
 */
const write = (level: LogLevel, scope: string, message: string, payload?: LogPayload): void => {
  if (SEVERITY[level] < SEVERITY[threshold]) return;
  const now: Date = new Date();
  const time: string = formatTime(now);
  const prefix: string = `[${time}] [${level}] [${scope}] ${message}`;
  if (payload === undefined) console[level](prefix);
  else console[level](prefix, payload);
};

/**
 * Логгер с приклеенной областью. Область — модуль или слой, по ней фильтруют
 * консоль: `createLog('ui/app')`, `createLog('storage')`.
 */
export const createLog = (scope: string): Logger => {
  return {
    debug: (message, payload) => write('debug', scope, message, payload),
    info: (message, payload) => write('info', scope, message, payload),
    warn: (message, payload) => write('warn', scope, message, payload),
    error: (message, payload) => write('error', scope, message, payload),
  };
};

/** Логгер по умолчанию для мест, у которых своей области нет. */
export const Log: Logger = createLog('app');
