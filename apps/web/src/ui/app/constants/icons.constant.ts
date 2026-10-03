import type { TabId } from '../types';

/**
 * Знак приложения и значки вкладок — контуры SVG, а не компоненты: значок
 * отличается от значка только линией `d`, а обвязка (размер, `viewBox`,
 * `aria-hidden`) у всех одна и живёт в `TabIcon`.
 *
 * Значки лежат здесь, а не в `TABS`: список вкладок остаётся один и остаётся
 * данными (`tabs.ts`, SHELL_IS_SINGLE_SOURCE), а разметка в `.ts`-файле
 * констант не появляется.
 *
 * `Record<TabId, string>` — забытая вкладка падает компилятором, а не рисуется
 * пустым местом.
 */
export const TAB_ICON_PATHS: Record<TabId, string> = {
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  matrix: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
};

/** Знак бренда — та же матрица 2x2, что и у вкладки «Матрица»: приложение про неё. */
export const BRAND_MARK_PATH: string = TAB_ICON_PATHS.matrix;
