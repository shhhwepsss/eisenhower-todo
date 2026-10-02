import { useStorageStatus } from '@/state';
import type { StorageStatus } from '@/state';
import styles from './StorageBanner.module.scss';

/**
 * STORAGE_FAILURE_IS_VISIBLE (docs/specs/4-architecture.md §3): отказ записи
 * посреди сессии нельзя ни проглатывать, ни прятать полноэкранным экраном —
 * задачи уже в состоянии, и человек не должен их терять из виду. Полоса живёт
 * рядом с вкладками, а не вместо них: `write-failed` показывается только тогда,
 * когда вкладки остаются смонтированными (см. `ui/app/App.tsx`).
 *
 * Отказ на старте (`unavailable`) сюда не попадает — для него нет ни задач на
 * экране, ни вкладок, которым эта полоса могла бы сопутствовать: там весь
 * экран отдан `AppStorageError`.
 */
export const StorageBanner = () => {
  const status: StorageStatus = useStorageStatus();

  if (status !== 'write-failed') return null;

  return (
    <p className={styles.error} role="alert">
      Хранилище не отвечает или его содержимое повреждено. Правки видны на экране, но
      не сохраняются — не закрывайте вкладку.
    </p>
  );
};
