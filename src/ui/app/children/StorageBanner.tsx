import { useStorageIsPersistent, useStorageStatus } from '@/state';
import type { StorageStatus } from '@/state';
import styles from './StorageBanner.module.scss';

/**
 * STORAGE_FAILURE_IS_VISIBLE (docs/specs/4-architecture.md §3): отказ хранилища
 * нельзя проглатывать — пользователь продолжает работать и вправе знать, что его
 * правки никуда не записываются.
 *
 * Два разных сообщения про две разные беды. Отказ — данные уже в опасности,
 * поэтому `role="alert"`. Непостоянное хранилище — предупреждение на будущее:
 * писать удаётся, но в память, и до закрытия вкладки.
 *
 * Полоса живёт в каркасе приложения, а не во вкладке: беда общая для обеих.
 */
export const StorageBanner = () => {
  const status: StorageStatus = useStorageStatus();
  const persistent: boolean = useStorageIsPersistent();

  if (status === 'error') {
    return (
      <p className={styles.error} role="alert">
        Хранилище не отвечает или его содержимое повреждено. Правки видны на экране, но
        не сохраняются — не закрывайте вкладку.
      </p>
    );
  }

  if (!persistent) {
    return (
      <p className={styles.warning} role="status">
        Постоянного хранилища нет: задачи живут до закрытия вкладки.
      </p>
    );
  }

  return null;
};
