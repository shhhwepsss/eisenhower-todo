import type { TaskProps } from './task-props.type';

/**
 * Строка списка открывает окно правки, но сама его не держит: «какая задача
 * открыта» — состояние вкладки (`useTaskDialog` в `ui/list`), а строка только
 * сообщает, по какой из них кликнули. Так же устроена карточка матрицы.
 */
export type TaskRowProps = TaskProps & { onOpen: (id: string) => void };
