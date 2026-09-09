import { createMemoryStorage } from '@/storage/memory';
import type { KeyValueStorage } from '@/storage';

describe('createMemoryStorage', () => {
  it('отдаёт null за ключ, которого не клали', () => {
    expect(createMemoryStorage().getItem('нет такого')).toBeNull();
  });

  it('возвращает положенное', () => {
    const storage: KeyValueStorage = createMemoryStorage();

    storage.setItem('ключ', 'значение');

    expect(storage.getItem('ключ')).toBe('значение');
  });

  it('два хранилища не видят друг друга: память своя у каждой вкладки', () => {
    const first: KeyValueStorage = createMemoryStorage();
    const second: KeyValueStorage = createMemoryStorage();

    first.setItem('ключ', 'значение');

    expect(second.getItem('ключ')).toBeNull();
  });
});
