/**
 * Публичный контракт слоя хранения (docs/specs/4-architecture.md §4).
 *
 * Наружу торчат порты и ошибки — то, чем пользуется стор. Формат снапшота, ключи
 * хранилища и разбор — внутренности слоя: у них один потребитель, и он здесь же.
 * `ui/` не ходит сюда вовсе — STORAGE_IS_ISOLATED, правило ESLint в eslint.config.js.
 */
export { isStorageError, storageError } from './errors';
export type * from './types';
