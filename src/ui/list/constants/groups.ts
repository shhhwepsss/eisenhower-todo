import type { ListGroup } from '@/domain';

export type GroupMeta = { id: ListGroup; title: string; hint: string; empty: string };

/**
 * Три группы списка в фиксированном порядке сверху вниз (PRD §3). Порядок групп
 * не зависит от выбранной сортировки: сортировка работает внутри группы.
 *
 * Отдельная группа для выполненных нужна, чтобы сделанное не смешивалось
 * с неразобранным — иначе «Входящие» перестают отвечать на вопрос «что разобрать».
 */
export const LIST_GROUPS: readonly GroupMeta[] = [
  { id: 'inbox', title: 'Входящие', hint: 'Требуют разбора', empty: 'Всё разобрано' },
  { id: 'assigned', title: 'В квадранте', hint: 'Разобранные задачи', empty: 'Пока пусто' },
  { id: 'done', title: 'Выполненные', hint: 'Сделанное', empty: 'Пока ничего не сделано' },
];
