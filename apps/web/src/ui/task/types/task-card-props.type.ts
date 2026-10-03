import type { ReactNode } from 'react';
import type { TaskProps } from './task-props.type';

/**
 * Ручка приезжает в карточку готовым узлом, а не собирается внутри неё: слушатели
 * жеста живут в `SortableCard` (слайс матрицы), и знать о `@dnd-kit` карточке
 * незачем — DND_IS_UI_ONLY держит границу только снаружи `ui/`, а внутри её
 * держит эта форма пропса.
 */
export type TaskCardProps = TaskProps & { handle: ReactNode };
