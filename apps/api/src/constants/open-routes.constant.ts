import type { OpenRoute } from '../types';
import { API_BASE_PATH, AUTH_BASE_PATH } from './api-paths.constant';

const AUTH_ROUTES: string = `${AUTH_BASE_PATH}/*`;

/**
 * Маршруты, открытые без сессии (AUTH_REQUIRED_BY_DEFAULT, docs/specs/52-google-auth.md),
 * — единственное место, где ручка открывается. Метод и путь — как они зарегистрированы в
 * Hono, вместе с `/api`: `requireSession` сверяет их с совпавшими маршрутами, а не с
 * адресом запроса, поэтому разбирать путь самому не приходится.
 *
 * Открывается пара «метод + путь», а не путь: `app.post('/health', …)` рядом с открытым
 * `GET /health` закрыт, пока его не впишут сюда.
 */
export const OPEN_ROUTES: readonly OpenRoute[] = [
  { method: 'GET', path: `${API_BASE_PATH}/health` },
  { method: 'GET', path: AUTH_ROUTES },
  { method: 'POST', path: AUTH_ROUTES },
];
