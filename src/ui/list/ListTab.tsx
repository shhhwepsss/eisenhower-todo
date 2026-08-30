import styles from './ListTab.module.scss';

export function ListTab() {
  return (
    <section className={styles.panel} role="tabpanel" id="panel-list" aria-labelledby="tab-list">
      <p className={styles.placeholder}>Список задач появится в фазе 7.</p>
    </section>
  );
}
