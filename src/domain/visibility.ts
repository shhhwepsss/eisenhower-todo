import type { Task } from './types';

/**
 * Живая задача — та, у которой нет надгробия (DELETE_IS_A_TOMBSTONE,
 * docs/specs/4-architecture.md §2). Удалённая остаётся в снапшоте,
 * но не попадает ни в одну выборку.
 */
export const isTaskLive = (task: Task): boolean => {
  return task.deletedAt === null;
};

/**
 * Задача видна в матрице — DONE_LEAVES_MATRIX (docs/specs/4-architecture.md §9).
 * Завершённая уходит из матрицы целиком, включая зону «Входящие».
 */
export const isTaskInMatrix = (task: Task): boolean => {
  return isTaskLive(task) && task.status !== 'done';
};
