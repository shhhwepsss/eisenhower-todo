import styles from './MatrixTab.module.scss';

export function MatrixTab() {
  return (
    <section
      className={styles.panel}
      role="tabpanel"
      id="panel-matrix"
      aria-labelledby="tab-matrix"
    >
      <p className={styles.placeholder}>Матрица появится в фазе 5.</p>
    </section>
  );
}
