/**
 * Вошедший пользователь (docs/specs/52-google-auth.md, AUTH_TYPES_STAY_AT_EDGE). Модули
 * получают его, а не типы Auth.js. `id` — `users.id`, по нему #46 фильтрует задачи.
 *
 * Имя и почту Google может не отдать, поэтому `null` — допустимое значение.
 */
export type SessionUser = { id: string; name: string | null; email: string | null };
