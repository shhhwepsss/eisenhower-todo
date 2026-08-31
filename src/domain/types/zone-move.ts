import type { Zone } from './zone';

/** Ключ перехода: «откуда->куда». */
export type ZoneMoveKey = `${Zone}->${Zone}`;

/** Что происходит с рангом при переходе (docs/specs/4-architecture.md §1). */
export type RankRule = 'keep' | 'regenerate';
