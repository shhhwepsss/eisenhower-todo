import type { ReactNode } from 'react';

import type { Repositories } from '@/storage';

/**
 * Репозитории приходят параметром, а не создаются внутри, — STORAGE_IS_ISOLATED
 * (спека §4): слой состояния знает порт, а какая за ним реализация, решает вход
 * в приложение. В тесте туда же подставляется поддельная.
 */
export type AppStateProviderProps = {
  repositories: Repositories;
  children: ReactNode;
};
