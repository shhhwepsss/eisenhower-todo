/**
 * Пути API (docs/specs/52-google-auth.md) — одно значение в одном месте: от них зависят
 * `basePath` приложения, маршрут Auth.js, `OPEN_ROUTES`, признак глобального middleware и
 * проверка `AUTH_URL`.
 */
export const API_BASE_PATH: string = '/api';

/** Путь ручек Auth.js относительно `/api`; модуль auth регистрирует под ним `/*`. */
export const AUTH_PATH: string = '/auth';

/** Полный путь ручек Auth.js: из пути `AUTH_URL` библиотека берёт свой `basePath`. */
export const AUTH_BASE_PATH: string = `${API_BASE_PATH}${AUTH_PATH}`;

/**
 * Путь глобального middleware: `app.use('*', …)` под `basePath('/api')`. Маршрут с
 * методом `ALL` и этим путём — не ручка, а общий шаг перед ней.
 */
export const GLOBAL_MIDDLEWARE_PATH: string = `${API_BASE_PATH}/*`;
