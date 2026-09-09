import type { UiSettings } from '../types';

/**
 * Настройки нового пользователя (docs/specs/4-architecture.md §2, §8).
 *
 * Порядок по времени создания — единственная сортировка, которая ничего не
 * требует от задачи: он есть у любой задачи с рождения и не зависит ни от
 * разбора, ни от статуса.
 */
export const DEFAULT_UI_SETTINGS: UiSettings = { listSort: 'created' };
