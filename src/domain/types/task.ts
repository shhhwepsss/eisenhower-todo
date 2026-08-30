import type { TaskStatus } from './task-status';

/**
 * Сериализованная форма задачи (docs/specs/4-architecture.md §2).
 *
 * Признаки лежат плоско, а не вложенным объектом: так проще миграции и будущее
 * слияние по полям. Поля `quadrant` здесь нет и не будет — QUADRANT_IS_DERIVED.
 */
export type Task = {
  /** UUID v4. Приходит извне: домен идентификаторы не конструирует. */
  id: string;
  /** Непустая после trim строка. */
  text: string;
  /** Разобрана ли задача. `false` — зона «Входящие». */
  assigned: boolean;
  /** Осмыслен только при `assigned === true`, иначе нормализован в `false`. */
  urgent: boolean;
  /** Осмыслен только при `assigned === true`, иначе нормализован в `false`. */
  important: boolean;
  status: TaskStatus;
  /** Дробный индекс: порядок внутри квадранта. Вне квадранта смысла не имеет. */
  rank: string;
  /** ISO-8601 UTC. */
  createdAt: string;
  /** ISO-8601 UTC. */
  updatedAt: string;
  /** ISO-8601 UTC — надгробие; `null` у живой задачи. */
  deletedAt: string | null;
};
