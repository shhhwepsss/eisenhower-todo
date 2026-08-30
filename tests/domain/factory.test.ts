import { createTask, placementOf } from '@/domain';

import { NOW } from './fixtures';

describe('createTask', () => {
  it('рождает неразобранную задачу во «Входящих» (MANUAL_PRIORITISATION)', () => {
    const task = createTask({ id: 'task-1', title: 'купить хлеб', now: NOW });

    expect(task).toEqual({
      id: 'task-1',
      title: 'купить хлеб',
      text: '',
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

    expect(createTask({ id, title: 'т', now: NOW }).id).toBe(id);
  });

  it('QUADRANT_IS_DERIVED: хранимого поля quadrant нет', () => {
    expect(Object.keys(createTask({ id: 'task-1', title: 'т', now: NOW }))).not.toContain(
      'quadrant',
    );
  });

  it('заголовок и описание обрезаются по краям', () => {
    const task = createTask({ id: 'task-1', title: '  дело  ', text: '  подробности  ', now: NOW });

    expect(task.title).toBe('дело');
    expect(task.text).toBe('подробности');
  });

  it('описание можно не передавать — пустое описание нормально', () => {
    expect(createTask({ id: 'task-1', title: 'дело', now: NOW }).text).toBe('');
    expect(createTask({ id: 'task-1', title: 'дело', text: '   ', now: NOW }).text).toBe('');
  });

  it.each(['', '   ', '\n\t'])('пустой после trim заголовок (%j) — ошибка', (title) => {
    expect(() => createTask({ id: 'task-1', title, now: NOW })).toThrow(/TITLE_IS_NOT_EMPTY/);
  });
});
