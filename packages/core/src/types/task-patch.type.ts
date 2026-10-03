import type { Task } from './task.type';

/**
 * Всё, что мутация вправе менять. `id`, `createdAt` и `updatedAt` сюда не входят.
 *
 * Не реэкспортируется из `types/index.ts`: тип внутренний для `mutations.ts`, а всё,
 * что попадает в баррель, становится публичным API ядра (`export type *` в
 * `src/index.ts`). Выставить его наружу — решение #53.
 */
export type TaskPatch = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>;
