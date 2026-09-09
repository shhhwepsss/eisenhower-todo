import { createContext, useContext } from 'react';
import type { Context } from 'react';

import type { Store } from './types';

/**
 * Стор для дерева компонентов (docs/specs/4-architecture.md §5).
 *
 * Значение по умолчанию — `null`, а не пустое состояние: приложение без провайдера
 * не «работает с нулём задач», оно собрано неправильно, и узнать об этом лучше
 * первым же рендером, а не молчаливо пустым экраном.
 *
 * Наружу слоя контекст не выходит: `ui/` видит только хуки (STATE_ACCESS_VIA_HOOKS).
 */
export const StoreContext: Context<Store | null> = createContext<Store | null>(null);

export const useStore = (): Store => {
  const store: Store | null = useContext(StoreContext);
  if (store === null) {
    throw new Error('Хуки состояния вызваны вне <AppStateProvider>');
  }
  return store;
};
