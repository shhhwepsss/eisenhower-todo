import type { MockInstance } from 'vitest';

import { createTask } from '@/domain';
import type { Task, UiSettings } from '@/domain';
import { decodeSettings, decodeTasks } from '@/storage/decode';
import { isStorageError } from '@/storage/errors';
import type { SnapshotEnvelope, StorageError } from '@/storage';

/**
 * Форма задачи выписана здесь руками, а не взята у фабрики: иначе тест сверял бы
 * код с ним же самим и не заметил бы поля, пропавшего из снапшота.
 */
const STORED_TASK: Record<string, unknown> = {
  id: '8f3b1c2e-0c2a-4f9e-9a1b-2d4c6e8a0b12',
  title: 'разобрать почту',
  text: '',
  assigned: true,
  urgent: false,
  important: true,
  status: 'todo',
  rank: 'a1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T10:30:00.000Z',
  deletedAt: null,
};

const RAW: string = '<исходная строка снапшота>';

const envelopeOf = (tasks: unknown[]): SnapshotEnvelope => ({ version: 1, tasks });

const failureOf = (envelope: SnapshotEnvelope): StorageError => {
  try {
    decodeTasks(envelope, RAW);
  } catch (error) {
    if (isStorageError(error)) return error;
    throw error;
  }
  throw new Error('decodeTasks разобрал то, что разбирать не должен был');
};

describe('decodeTasks', () => {
  it('возвращает задачи снапшота как есть', () => {
    const tasks: Task[] = decodeTasks(envelopeOf([STORED_TASK]), RAW);

    expect(tasks).toStrictEqual([STORED_TASK]);
  });

  it('возвращает надгробия наравне с живыми: их прячет выборка, а не хранилище', () => {
    const buried: Record<string, unknown> = {
      ...STORED_TASK,
      deletedAt: '2026-02-02T12:00:00.000Z',
    };

    const tasks: Task[] = decodeTasks(envelopeOf([buried]), RAW);

    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.deletedAt).toBe('2026-02-02T12:00:00.000Z');
  });

  it('читает то, что произвёл домен: фабрика и разбор сходятся по всем полям', () => {
    const born: Task = createTask({ id: 'task-1', title: 'задача', now: '2026-03-03T09:00:00.000Z' });

    const tasks: Task[] = decodeTasks(envelopeOf([born]), RAW);

    expect(tasks).toStrictEqual([born]);
  });

  it('пустой снапшот — это не отказ', () => {
    expect(decodeTasks(envelopeOf([]), RAW)).toStrictEqual([]);
  });

  it.each([
    { name: 'поля tasks нет', envelope: { version: 1 } },
    { name: 'tasks — объект', envelope: { version: 1, tasks: {} } },
    { name: 'tasks — строка', envelope: { version: 1, tasks: '[]' } },
  ])('отказывается читать снапшот без списка задач: $name', ({ envelope }) => {
    const failure: StorageError = failureOf(envelope);

    expect(failure.kind).toBe('unreadable');
    expect(failure.raw).toBe(RAW);
  });

  it.each([
    { field: 'id', value: '' },
    { field: 'title', value: '   ' },
    { field: 'text', value: null },
    { field: 'assigned', value: 'true' },
    { field: 'urgent', value: 1 },
    { field: 'important', value: undefined },
    { field: 'status', value: 'later' },
    { field: 'rank', value: 42 },
    { field: 'createdAt', value: '2026' },
    { field: 'updatedAt', value: 'вчера' },
    { field: 'deletedAt', value: false },
  ])('одна битая задача делает нечитаемым весь снапшот: поле $field', ({ field, value }) => {
    const broken: Record<string, unknown> = { ...STORED_TASK, [field]: value };

    const failure: StorageError = failureOf(envelopeOf([STORED_TASK, broken]));

    expect(failure.kind).toBe('unreadable');
    expect(failure.message).toContain(field);
    expect(failure.message).toContain('№1');
  });

  it.each([{ name: 'null', task: null }, { name: 'строка', task: 'задача' }])(
    'задача, которая не объект, тоже ломает снапшот: $name',
    ({ task }) => {
      expect(failureOf(envelopeOf([task])).kind).toBe('unreadable');
    },
  );

  it('лишнее поле чтению не мешает: проверяется наличие своих, а не отсутствие чужих', () => {
    const withExtra: Record<string, unknown> = { ...STORED_TASK, colour: 'красный' };

    expect(decodeTasks(envelopeOf([withExtra]), RAW)).toHaveLength(1);
  });
});

describe('decodeSettings', () => {
  it('читает известный ключ сортировки', () => {
    const settings: UiSettings = decodeSettings({ version: 1, listSort: 'alphabet' });

    expect(settings).toStrictEqual({ listSort: 'alphabet' });
  });

  it.each([
    { name: 'неизвестное значение', envelope: { version: 1, listSort: 'по цвету' } },
    { name: 'поля нет', envelope: { version: 1 } },
    { name: 'не строка', envelope: { version: 1, listSort: 7 } },
  ])('чинит настройку дефолтом, а не отказом: $name', ({ envelope }) => {
    const warn: MockInstance = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const settings: UiSettings = decodeSettings(envelope);

    expect(settings).toStrictEqual({ listSort: 'created' });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
