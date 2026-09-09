import { SCHEMA_VERSION } from '@/storage/constants';
import { openEnvelope, sealEnvelope } from '@/storage/envelope';
import { isStorageError } from '@/storage/errors';
import type { SnapshotEnvelope, StorageError } from '@/storage';

/**
 * Отказы конверта проверяются через пойманную ошибку, а не через `toThrow`:
 * важен не факт исключения, а его вид и то, что исходная строка уцелела.
 */
const failureOf = (raw: string): StorageError => {
  try {
    openEnvelope(raw);
  } catch (error) {
    if (isStorageError(error)) return error;
    throw error;
  }
  throw new Error(`openEnvelope не отказался разбирать ${raw}`);
};

describe('openEnvelope', () => {
  it('отдаёт содержимое конверта текущей версии', () => {
    const raw: string = JSON.stringify({ version: SCHEMA_VERSION, tasks: [], listSort: 'created' });

    const envelope: SnapshotEnvelope = openEnvelope(raw);

    expect(envelope['tasks']).toEqual([]);
    expect(envelope['listSort']).toBe('created');
  });

  it('отказывается разбирать строку, которая не JSON', () => {
    const raw: string = '{"version":1,"tasks":[';

    const failure: StorageError = failureOf(raw);

    expect(failure.kind).toBe('unreadable');
    expect(failure.raw).toBe(raw);
    expect(failure.cause).toBeInstanceOf(SyntaxError);
  });

  it.each([
    { name: 'массив', raw: '[]' },
    { name: 'число', raw: '42' },
    { name: 'null', raw: 'null' },
    { name: 'строка', raw: '"снапшот"' },
  ])('отказывается разбирать JSON, который не объект: $name', ({ raw }) => {
    expect(failureOf(raw).kind).toBe('unreadable');
  });

  it.each([
    { name: 'поля нет', raw: '{"tasks":[]}' },
    { name: 'версия строкой', raw: '{"version":"1","tasks":[]}' },
    { name: 'версия null', raw: '{"version":null,"tasks":[]}' },
    { name: 'версия дробная', raw: '{"version":1.5,"tasks":[]}' },
    { name: 'версия нулевая', raw: '{"version":0,"tasks":[]}' },
  ])('SCHEMA_VERSION_IS_EXPLICIT: версии наугад не бывает — $name', ({ raw }) => {
    const failure: StorageError = failureOf(raw);

    expect(failure.kind).toBe('unreadable');
    expect(failure.raw).toBe(raw);
  });

  it('отказывается читать версию из будущего: миграций нет, гадать нельзя', () => {
    const raw: string = JSON.stringify({ version: SCHEMA_VERSION + 1, tasks: [] });

    const failure: StorageError = failureOf(raw);

    expect(failure.kind).toBe('unsupported-version');
    expect(failure.message).toContain(String(SCHEMA_VERSION + 1));
    expect(failure.raw).toBe(raw);
  });
});

describe('sealEnvelope', () => {
  it('ставит штамп версии на нагрузку', () => {
    const sealed: string = sealEnvelope({ tasks: [] });

    expect(JSON.parse(sealed)).toStrictEqual({ tasks: [], version: SCHEMA_VERSION });
  });

  it('версию конверта нагрузка подменить не может', () => {
    const sealed: string = sealEnvelope({ version: 99, tasks: [] });

    const envelope: SnapshotEnvelope = openEnvelope(sealed);

    expect(envelope['version']).toBe(SCHEMA_VERSION);
  });

  it('запечатанное вскрывается обратно тем же', () => {
    const payload: SnapshotEnvelope = { listSort: 'alphabet' };

    const envelope: SnapshotEnvelope = openEnvelope(sealEnvelope(payload));

    expect(envelope).toStrictEqual({ ...payload, version: SCHEMA_VERSION });
  });
});
