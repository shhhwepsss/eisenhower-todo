import type { RankRule, ZoneMoveKey } from '../types';

/**
 * Все переходы задачи между зонами матрицы — 5 зон × 5 зон, ни одного пропуска.
 *
 * Таблица не декорация: по ней `placeTask` решает, перегенерировать ранг или
 * оставить (`src/domain/mutations.ts`).
 *
 * Само правило короче таблицы — «во «Входящие» ранг не трогаем, в квадрант
 * перегенерируем». Таблица оставлена ради проверки исчерпанности: тип
 * `Record<ZoneMoveKey, RankRule>` требует все 25 ключей, поэтому пополнение
 * `Zone` не проедет молча, а упрётся в ошибку компиляции. Записанное функцией
 * правило распространилось бы на новую зону само, никого не спросив.
 *
 * Правильность держится двумя тестами в `zone-moves.test.ts`, и оба нужны: один
 * сверяет строки с правилом из спеки §1, второй — поведение `placeTask` с таблицей.
 * Второй в одиночку бесполезен: мутация читает ту же строку, они согласованы
 * по построению.
 *
 * Чего в таблице нет и не будет: статуса. `done` — это не зона, задача уходит
 * из матрицы целиком (DONE_LEAVES_MATRIX) и возвращается в ту же зону, из которой
 * ушла; за это отвечает `setStatus`, а не переход между зонами.
 */
export const ZONE_MOVES: Record<ZoneMoveKey, RankRule> = {
  'inbox->inbox': 'keep',
  'inbox->Q1': 'regenerate',
  'inbox->Q2': 'regenerate',
  'inbox->Q3': 'regenerate',
  'inbox->Q4': 'regenerate',

  'Q1->inbox': 'keep',
  'Q1->Q1': 'regenerate',
  'Q1->Q2': 'regenerate',
  'Q1->Q3': 'regenerate',
  'Q1->Q4': 'regenerate',

  'Q2->inbox': 'keep',
  'Q2->Q1': 'regenerate',
  'Q2->Q2': 'regenerate',
  'Q2->Q3': 'regenerate',
  'Q2->Q4': 'regenerate',

  'Q3->inbox': 'keep',
  'Q3->Q1': 'regenerate',
  'Q3->Q2': 'regenerate',
  'Q3->Q3': 'regenerate',
  'Q3->Q4': 'regenerate',

  'Q4->inbox': 'keep',
  'Q4->Q1': 'regenerate',
  'Q4->Q2': 'regenerate',
  'Q4->Q3': 'regenerate',
  'Q4->Q4': 'regenerate',
};
