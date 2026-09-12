import type { Quadrant } from '@/domain';

/** Подпись зоны: что это за место и по какому признаку задача сюда попала. */
export type ZoneMeta = { title: string; hint: string; empty: string };

/**
 * Названия квадрантов — из PRD §3: Q1 делать сейчас, Q2 планировать,
 * Q3 минимизировать, Q4 не делать. Смысл квадранта — подсказка пользователю,
 * поэтому подпись с осями стоит рядом с названием, а не вместо него.
 */
export const QUADRANT_META: Record<Quadrant, ZoneMeta> = {
  Q1: { title: 'Делать сейчас', hint: 'Срочно и важно', empty: 'Здесь пусто' },
  Q2: { title: 'Планировать', hint: 'Важно, не срочно', empty: 'Здесь пусто' },
  Q3: { title: 'Минимизировать', hint: 'Срочно, не важно', empty: 'Здесь пусто' },
  Q4: { title: 'Не делать', hint: 'Ни то ни другое', empty: 'Здесь пусто' },
};

export const INBOX_META: ZoneMeta = {
  title: 'Входящие',
  hint: 'Очередь на разбор, новые сверху',
  empty: 'Всё разобрано',
};
