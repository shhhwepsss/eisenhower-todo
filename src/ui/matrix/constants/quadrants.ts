import type { Quadrant } from '@/domain';
import { ZONE_LABELS } from '@/ui/task';

/** Подпись зоны: что это за место и по какому признаку задача сюда попала. */
export type ZoneMeta = { title: string; hint: string; empty: string };

/**
 * Названия квадрантов — из PRD §3: Q1 делать сейчас, Q2 планировать,
 * Q3 минимизировать, Q4 не делать. Смысл квадранта — подсказка пользователю,
 * поэтому подпись с осями стоит рядом с названием, а не вместо него.
 *
 * `title` читается из `ZONE_LABELS` (`@/ui/task`), а не дублируется здесь:
 * то же название видно и в списке (полоса + подпись строки), и расхождение
 * было бы не стилистикой, а сменой смысла зоны у пользователя на глазах
 * (SSOT-регрессия между `QUADRANT_META` и списком, найдена на визуальной
 * проверке). `hint` и `empty` остаются здесь — они нужны только матрице.
 */
export const QUADRANT_META: Record<Quadrant, ZoneMeta> = {
  Q1: { title: ZONE_LABELS.Q1, hint: 'Срочно и важно', empty: 'Здесь пусто' },
  Q2: { title: ZONE_LABELS.Q2, hint: 'Важно, не срочно', empty: 'Здесь пусто' },
  Q3: { title: ZONE_LABELS.Q3, hint: 'Срочно, не важно', empty: 'Здесь пусто' },
  Q4: { title: ZONE_LABELS.Q4, hint: 'Ни то ни другое', empty: 'Здесь пусто' },
};

export const INBOX_META: ZoneMeta = {
  title: ZONE_LABELS.inbox,
  hint: 'Очередь на разбор, новые сверху',
  empty: 'Всё разобрано',
};
