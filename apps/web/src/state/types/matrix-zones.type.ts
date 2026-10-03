import type { Task, Zone } from '@eisenhower/core';

/** Все пять зон матрицы разом: «Входящие» и четыре квадранта. */
export type MatrixZones = Record<Zone, Task[]>;
