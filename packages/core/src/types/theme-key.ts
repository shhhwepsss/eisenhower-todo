/**
 * Тема интерфейса (docs/specs/35-design-system.md §4) — рядом с `ListSortKey`:
 * тот же путь до хранилища, то же место в модели.
 *
 * `'system'` не хранит выбор явно: атрибут `data-theme` для него не ставится
 * вовсе, решает медиазапрос `prefers-color-scheme`, и смена системной настройки
 * подхватывается без перезагрузки (см. `src/styles/_theme.scss`).
 */
export type ThemeKey = 'system' | 'light' | 'dark';
