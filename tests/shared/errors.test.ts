import { describeError } from '@/shared/errors';
import type { LogPayload } from '@/shared/logger';

describe('describeError', () => {
  it('раскладывает ошибку на имя, сообщение и стек', () => {
    const error: TypeError = new TypeError('снапшот не читается');

    const payload: LogPayload = describeError(error);

    expect(payload).toStrictEqual({
      name: 'TypeError',
      message: 'снапшот не читается',
      stack: error.stack,
    });
  });

  it('кладёт как есть то, что ошибкой не является: приведение к строке теряет данные', () => {
    const thrown: unknown = { code: 22, name: 'QuotaExceededError' };

    const payload: LogPayload = describeError(thrown);

    expect(payload).toStrictEqual({ thrown });
  });

  it('переживает брошенный undefined', () => {
    const payload: LogPayload = describeError(undefined);

    expect(payload).toStrictEqual({ thrown: undefined });
  });
});
