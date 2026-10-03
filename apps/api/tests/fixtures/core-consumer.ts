import { createTask, resolveZone } from '@eisenhower/core';
import type { Task, Zone } from '@eisenhower/core';

/**
 * Функция, которая пользуется ядром. Собирается тем же `vite.config.ts`, что и
 * настоящая функция: пока API core не импортирует (до #46), только она и проверяет,
 * что сборка вклеивает core (`FUNCTION_IS_SELF_CONTAINED`).
 */
export default (): Zone => {
  const task: Task = createTask({ id: 'fixture', title: 'Задача', now: '2026-10-02T00:00:00.000Z' });
  return resolveZone(task);
};
