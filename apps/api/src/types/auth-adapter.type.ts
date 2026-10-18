import type { Adapter } from '@auth/core/adapters';

/**
 * Адаптер Auth.js: через него вход находит и создаёт пользователя
 * (docs/specs/52-google-auth.md). Реализация — в `src/db/neon/`, приложение знает только
 * этот контракт (DB_BEHIND_INTERFACE).
 */
export type AuthAdapter = Adapter;
