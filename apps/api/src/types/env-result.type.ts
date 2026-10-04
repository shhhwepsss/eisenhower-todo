import type { Env } from './env.type';

/**
 * Итог разбора окружения. Ошибка — не исключение, а значение: её обрабатывает тот, кто
 * отвечает на запрос, и он же пишет лог (CLAUDE.md §9).
 *
 * `variables` — только имена переменных, без значений: значение — это секрет.
 */
export type EnvResult = { ok: true; env: Env } | { ok: false; variables: string[] };
