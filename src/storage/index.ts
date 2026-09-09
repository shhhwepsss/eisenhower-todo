/**
 * Публичный контракт слоя хранения (docs/specs/4-architecture.md §4).
 *
 * Наружу торчат порты и ошибки; `ui/` сюда не ходит вовсе — STORAGE_IS_ISOLATED,
 * правило ESLint в eslint.config.js.
 */
export { isStorageError, storageError } from './errors';
export type * from './types';
