import type { ZoneMove, ZoneMoveKey } from '../types';

/**
 * Все переходы задачи между зонами матрицы — 5 зон × 5 зон, ни одного пропуска.
 *
 * Таблица не декорация: по ней `placeTask` решает, перегенерировать ранг или
 * оставить (`src/domain/mutations.ts`). Пропущенный ключ — ошибка компиляции:
 * тип `Record<ZoneMoveKey, ZoneMove>` требует все 25.
 *
 * Правильность держится двумя тестами в `zone-moves.test.ts`, и оба нужны: один
 * сверяет строки с правилом из спеки §1, второй — поведение `placeTask` с таблицей.
 * Второй в одиночку бесполезен: мутация читает ту же строку, они согласованы
 * по построению.
 *
 * Правило ранга одно и то же по всей таблице, но выписано построчно осознанно:
 * ценность здесь не в правиле, а в том, что видно целиком, куда задача вообще
 * может уехать и что это значит.
 *
 * Чего в таблице нет и не будет: статуса. `done` — это не зона, задача уходит
 * из матрицы целиком (DONE_LEAVES_MATRIX) и возвращается в ту же зону, из которой
 * ушла; за это отвечает `setStatus`, а не переход между зонами.
 */
const KEEP: string = 'ранг не трогаем: во «Входящих» порядок задаёт createdAt';
const TO_INBOX: string = 'возврат в неразобранные — только перетаскиванием (спека §2)';
const REORDER: string = 'перестановка внутри квадранта: ранг по новым соседям';

export const ZONE_MOVES: Record<ZoneMoveKey, ZoneMove> = {
  'inbox->inbox': { rank: 'keep', why: `перетаскивание внутри «Входящих» ничего не меняет: ${KEEP}` },
  'inbox->Q1': { rank: 'regenerate', why: 'разбор: срочно и важно' },
  'inbox->Q2': { rank: 'regenerate', why: 'разбор: важно, не срочно' },
  'inbox->Q3': { rank: 'regenerate', why: 'разбор: срочно, не важно' },
  'inbox->Q4': { rank: 'regenerate', why: 'разбор: ни срочно, ни важно — осознанный выбор, а не его отсутствие' },

  'Q1->inbox': { rank: 'keep', why: TO_INBOX },
  'Q1->Q1': { rank: 'regenerate', why: REORDER },
  'Q1->Q2': { rank: 'regenerate', why: 'снята срочность' },
  'Q1->Q3': { rank: 'regenerate', why: 'снята важность' },
  'Q1->Q4': { rank: 'regenerate', why: 'сняты оба признака' },

  'Q2->inbox': { rank: 'keep', why: TO_INBOX },
  'Q2->Q1': { rank: 'regenerate', why: 'добавлена срочность' },
  'Q2->Q2': { rank: 'regenerate', why: REORDER },
  'Q2->Q3': { rank: 'regenerate', why: 'важность снята, срочность добавлена' },
  'Q2->Q4': { rank: 'regenerate', why: 'снята важность' },

  'Q3->inbox': { rank: 'keep', why: TO_INBOX },
  'Q3->Q1': { rank: 'regenerate', why: 'добавлена важность' },
  'Q3->Q2': { rank: 'regenerate', why: 'срочность снята, важность добавлена' },
  'Q3->Q3': { rank: 'regenerate', why: REORDER },
  'Q3->Q4': { rank: 'regenerate', why: 'снята срочность' },

  'Q4->inbox': { rank: 'keep', why: TO_INBOX },
  'Q4->Q1': { rank: 'regenerate', why: 'добавлены оба признака' },
  'Q4->Q2': { rank: 'regenerate', why: 'добавлена важность' },
  'Q4->Q3': { rank: 'regenerate', why: 'добавлена срочность' },
  'Q4->Q4': { rank: 'regenerate', why: REORDER },
};
