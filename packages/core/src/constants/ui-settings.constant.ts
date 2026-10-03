import type { UiSettings } from '../types';

/**
 * Настройки нового пользователя (docs/specs/4-architecture.md §2, §8).
 *
 * Порядок по времени создания — единственная сортировка, которая ничего не
 * требует от задачи: он есть у любой задачи с рождения и не зависит ни от
 * разбора, ни от статуса.
 *
 * Тема по умолчанию — `'system'` (docs/specs/35-design-system.md §4): решает
 * ОС, пока пользователь не выбрал явно.
 */
export const DEFAULT_UI_SETTINGS: UiSettings = { listSort: 'created', theme: 'system' };
