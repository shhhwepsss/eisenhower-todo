import { app } from '../src/app';

/**
 * Единственная функция Netlify (docs/specs/50-api-skeleton.md). Обработчик v2
 * принимает стандартный `Request` — ровно то, что ждёт `app.fetch`, адаптер не нужен.
 *
 * Netlify не получает этот файл как есть: `vite build` собирает его в
 * `dist/functions/api.mjs` вместе с `@eisenhower/core` (`FUNCTION_IS_SELF_CONTAINED`).
 */
export default (request: Request): Response | Promise<Response> => app.fetch(request);

/** Маршрут функции. Netlify читает его из собранного файла статически. */
export const config: { path: string } = { path: '/api/*' };
