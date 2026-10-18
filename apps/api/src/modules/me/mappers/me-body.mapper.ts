import type { SessionUser } from '../../../types';
import type { MeBody } from '../types';

/** Маппер границы «приложение → HTTP»: в ответ идут ровно идентификатор, имя и почта. */
export const toMeBody = (sessionUser: SessionUser): MeBody => {
  return { id: sessionUser.id, name: sessionUser.name, email: sessionUser.email };
};
