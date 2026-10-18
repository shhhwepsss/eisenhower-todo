import type { JWT } from '@auth/core/jwt';

/** JWT сессии, у которого `requireSession` уже проверил `sub` — идентификатор пользователя. */
export type SessionToken = JWT & { sub: string };
