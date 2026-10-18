import type { SessionUser } from '../../types';
import type { SessionToken } from '../types';

/**
 * Маппер границы «Auth.js → приложение» (AUTH_TYPES_STAY_AT_EDGE,
 * docs/specs/52-google-auth.md): модули получают `SessionUser`, а не JWT. Остальные поля
 * токена (`picture`, `iat`, `exp`, `jti`) границу не пересекают.
 */
export const toSessionUser = (token: SessionToken): SessionUser => {
  return { id: token.sub, name: token.name ?? null, email: token.email ?? null };
};
