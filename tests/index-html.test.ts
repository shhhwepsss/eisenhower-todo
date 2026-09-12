import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SETTINGS_KEY } from '@/storage/constants';

/**
 * Вспышка чужой темы (docs/specs/35-design-system.md §4): инлайн-скрипт в
 * `index.html` читает `localStorage` синхронно, до первой отрисовки React,
 * поэтому ключ хранилища там неизбежно продублирован литералом. Тест сверяет
 * этот литерал с `SETTINGS_KEY` — расхождение должно падать явно, а не молча
 * гасить применение сохранённой темы.
 */
describe('index.html: ключ хранилища темы', () => {
  it('литерал в инлайн-скрипте совпадает с SETTINGS_KEY', () => {
    const indexPath: string = join(process.cwd(), 'index.html');
    const html: string = readFileSync(indexPath, 'utf-8');

    expect(html).toContain(`localStorage.getItem('${SETTINGS_KEY}')`);
  });
});
