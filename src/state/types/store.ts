import type { Dispatch } from 'react';

import type { Action } from './action';
import type { AppState } from './app-state';

/**
 * Внутренность слоя: состояние плюс способ его менять. Наружу через `index.ts`
 * не выходит — `ui/` видит только хуки (STATE_ACCESS_VIA_HOOKS, спека §5).
 */
export type Store = {
  state: AppState;
  dispatch: Dispatch<Action>;
};
