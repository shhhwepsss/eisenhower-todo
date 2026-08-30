import { createTask, placementOf } from '@/domain';

import { NOW } from './fixtures';

describe('createTask', () => {
  it('рождает неразобранную задачу во «Входящих» (MANUAL_PRIORITISATION)', () => {
    const task = createTask({ id: 'task-1', text: 'купить хлеб', now: NOW });

    expect(task).toEqual({
      id: 'task-1',
      text: 'купить хлеб',
      assigned: false,
      urgent: false,
      important: false,
      status: 'todo',
      rank: 'a0',
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    });
    expect(placementOf(task)).toEqual({ zone: 'inbox' });
  });

  it('ID_IS_GLOBALLY_UNIQUE: id приходит снаружи, домен его не конструирует', () => {
    const id = '0f6d5a2e-8f7c-4c2a-9a1e-6c0b8f2d4e11';

    expect(createTask({ id, text: 'т', now: NOW }).id).toBe(id);
  });

  it('QUADRANT_IS_DERIVED: хранимого поля quadrant нет', () => {
    expect(Object.keys(createTask({ id: 'task-1', text: 'т', now: NOW }))).not.toContain('quadrant');
  });

  it('текст обрезается по краям', () => {
    expect(createTask({ id: 'task-1', text: '  дело  ', now: NOW }).text).toBe('дело');
  });

  it.each(['', '   ', '\n\t'])('пустой после trim текст (%j) — ошибка', (text) => {
    expect(() => createTask({ id: 'task-1', text, now: NOW })).toThrow(/TEXT_IS_NOT_EMPTY/);
  });
});
