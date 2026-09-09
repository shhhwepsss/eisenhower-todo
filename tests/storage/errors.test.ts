import { describeError } from '@/shared/errors';
import type { LogPayload } from '@/shared/logger';
import { isStorageError, storageError } from '@/storage';
import type { StorageError } from '@/storage';

const RAW_SNAPSHOT: string = '{"version":1,"tasks":[';

describe('storageError', () => {
  it('несёт вид отказа и остаётся настоящей ошибкой', () => {
    const error: StorageError = storageError('unreadable', 'снапшот не разбирается');

    expect(error).toBeInstanceOf(Error);
    expect(error.kind).toBe('unreadable');
    expect(error.message).toBe('снапшот не разбирается');
    expect(error.stack).toBeDefined();
  });

  it('без подробностей оставляет raw пустым: читать было нечего', () => {
    const error: StorageError = storageError('unavailable', 'хранилище недоступно');

    expect(error.raw).toBeNull();
  });

  it('сохраняет исходную строку снапшота — RAW_SNAPSHOT_SURVIVES_FAILURE', () => {
    const error: StorageError = storageError('unreadable', 'снапшот не разбирается', {
      raw: RAW_SNAPSHOT,
    });

    expect(error.raw).toBe(RAW_SNAPSHOT);
  });

  it('сохраняет исходное исключение в cause, а не в тексте сообщения', () => {
    const quota: DOMException = new DOMException('quota', 'QuotaExceededError');

    const error: StorageError = storageError('write-failed', 'снапшот не записан', {
      cause: quota,
    });

    expect(error.cause).toBe(quota);
    expect(error.message).toBe('снапшот не записан');
  });

  it('раскладывается логгером на ключи: имя, сообщение, стек', () => {
    const error: StorageError = storageError('write-failed', 'снапшот не записан');

    const payload: LogPayload = describeError(error);

    expect(payload).toStrictEqual({
      name: 'Error',
      message: 'снапшот не записан',
      stack: error.stack,
    });
  });
});

describe('isStorageError', () => {
  it('узнаёт отказ хранилища', () => {
    expect(isStorageError(storageError('unreadable', 'снапшот не разбирается'))).toBe(true);
  });

  it('не принимает за него постороннее исключение', () => {
    expect(isStorageError(new Error('что-то другое'))).toBe(false);
  });

  it('переживает то, что ошибкой не является', () => {
    expect(isStorageError({ kind: 'unreadable', raw: null })).toBe(false);
    expect(isStorageError(undefined)).toBe(false);
  });
});
