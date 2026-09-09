import type { StorageError, StorageErrorKind } from './types';

/** Необязательные подробности отказа: обе стороны нужны не всякому виду ошибки. */
type StorageErrorDetails = {
  /** Строка снапшота — там, где отказ произошёл на чтении. */
  raw?: string;
  /** Исключение, из-за которого всё случилось: `QuotaExceededError` и подобные. */
  cause?: unknown;
};

/**
 * Единственная дверь в `StorageError`: вид отказа и сообщение задаются здесь,
 * а `raw` и `cause` подставляются по месту.
 *
 * Исходное исключение уезжает в `cause`, а не растворяется в тексте сообщения:
 * `describeError` (src/shared/errors.ts) раскладывает его на ключи лога, и по ним
 * видно настоящее место падения, а не то, где мы его переупаковали.
 */
export const storageError = (
  kind: StorageErrorKind,
  message: string,
  details: StorageErrorDetails = {},
): StorageError => {
  const error: Error = new Error(message, { cause: details.cause });
  const raw: string | null = details.raw ?? null;
  return Object.assign(error, { kind, raw });
};

/**
 * Отличить отказ хранилища от любого другого исключения. Нужно вызывающей стороне:
 * из `catch` приезжает `unknown`, а решение «показать пользователю „данные
 * повреждены“ или упасть» зависит от вида.
 *
 * Проверка по форме, а не по классу, потому что класса нет. Ложное срабатывание
 * потребовало бы чужой ошибки ровно с этой парой полей: `kind` и `raw` вместе
 * в проекте ставит только `storageError`.
 */
export const isStorageError = (value: unknown): value is StorageError => {
  return value instanceof Error && 'kind' in value && 'raw' in value;
};
