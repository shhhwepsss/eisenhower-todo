import type { Context } from 'hono';
import type { AppEnv, SessionUser } from '../../types';
import { toMeBody } from './mappers/me-body.mapper';
import type { MeBody } from './types';

/**
 * HTTP-граница модуля me (docs/specs/52-google-auth.md). Сценария нет — пользователь уже
 * лежит в контексте, поэтому нет ни use-case, ни сервиса (docs/specs/60-api-modules.md:
 * use-case появляется вместе со сценарием).
 */
export class MeController {
  public show(context: Context<AppEnv>): Response {
    const sessionUser: SessionUser | undefined = context.get('sessionUser');
    // Ручка закрыта, и без сессии `requireSession` до неё не пропускает. Пустой
    // `sessionUser` здесь — сломанный порядок middleware, а не ошибка клиента.
    if (sessionUser === undefined) throw new Error('на закрытой ручке нет sessionUser');
    const body: MeBody = toMeBody(sessionUser);
    return context.json(body);
  }
}
