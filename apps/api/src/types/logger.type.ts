import type { LogPayload } from './log-payload.type';

export interface Logger {
  /** Подробности хода выполнения: что с чем сравнили, почему свернули в no-op. */
  debug(message: string, payload?: LogPayload): void;
  /** Заметные события: старт приложения, применённое действие пользователя. */
  info(message: string, payload?: LogPayload): void;
  /** Пережитая аномалия: данные починены дефолтом, работа продолжается. */
  warn(message: string, payload?: LogPayload): void;
  /** Операция не выполнена: исключение, отказ хранилища. */
  error(message: string, payload?: LogPayload): void;
}
