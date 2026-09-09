import type { Quadrant, Task } from '@/domain';
import { useQuadrantTasks } from '@/state';
import { QUADRANT_META } from '../constants';
import { MatrixZone } from './MatrixZone';

/**
 * Квадрант читает свою выборку сам, а не получает её от вкладки: тогда
 * добавление квадранта — строка в таблице `QUADRANT_FLAGS`, а не ещё один
 * проброс через пропсы.
 */
export const QuadrantZone = ({ quadrant }: { quadrant: Quadrant }) => {
  const tasks: Task[] = useQuadrantTasks(quadrant);
  return <MatrixZone meta={QUADRANT_META[quadrant]} tasks={tasks} />;
};
