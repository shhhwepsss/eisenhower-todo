import { SCHEMA_VERSION } from './constants';
import { storageError } from './errors';
import type { SnapshotEnvelope } from './types';

/**
 * Конверт снапшота (docs/specs/4-architecture.md §3): версия снаружи, данные внутри.
 *
 * Конверт один на оба хранимых документа — и задачи, и настройки лежат под
 * `{ version, ...данные }`. Здесь проверяется только он: что строка вообще JSON,
 * что это объект и что версия наша. Что лежит внутри — не забота этого модуля.
 *
 * Каждый отказ несёт исходную строку: она единственное, что осталось от данных
 * пользователя (RAW_SNAPSHOT_SURVIVES_FAILURE), и по ней их ещё можно достать руками.
 */

const isEnvelope = (value: unknown): value is SnapshotEnvelope => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch (cause) {
    throw storageError('unreadable', 'снапшот не разбирается как JSON', { raw, cause });
  }
};

/**
 * SCHEMA_VERSION_IS_EXPLICIT: версия обязана быть целым числом от единицы.
 * Строка `'1'`, `null` и отсутствие поля — это не «версия 1 по умолчанию»,
 * а снапшот, который мы не писали, и читать его наугад нельзя.
 */
const readVersion = (envelope: SnapshotEnvelope, raw: string): number => {
  const version: unknown = envelope['version'];
  if (typeof version !== 'number') {
    throw storageError('unreadable', 'у снапшота нет версии схемы', { raw });
  }
  if (!Number.isInteger(version) || version < 1) {
    throw storageError('unreadable', `версия схемы не похожа на версию: ${version}`, { raw });
  }
  return version;
};

/**
 * Вскрыть конверт: строка из хранилища → её содержимое, либо `StorageError`.
 *
 * Отсутствие ключа сюда не приходит: «первый запуск» — не отказ, и разбирается
 * он у вызывающей стороны, которой есть что подставить вместо данных.
 */
export const openEnvelope = (raw: string): SnapshotEnvelope => {
  const parsed: unknown = parseJson(raw);
  if (!isEnvelope(parsed)) {
    throw storageError('unreadable', 'снапшот разобрался, но это не объект', { raw });
  }

  const version: number = readVersion(parsed, raw);
  if (version !== SCHEMA_VERSION) {
    const message: string = `снапшот версии ${version}, а этот код понимает ${SCHEMA_VERSION}`;
    throw storageError('unsupported-version', message, { raw });
  }

  return parsed;
};

/**
 * Запечатать конверт: нагрузка → строка со штампом версии.
 *
 * Версия ставится после разворота нагрузки, а не до: поле `version` принадлежит
 * конверту, и подменить его изнутри нагрузка не должна даже по недосмотру.
 */
export const sealEnvelope = <TPayload extends object>(payload: TPayload): string => {
  return JSON.stringify({ ...payload, version: SCHEMA_VERSION });
};
