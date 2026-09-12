import type { ThemeKey } from '@/domain';
import { useTheme } from '@/state';
import type { Theme } from '@/state';
import { THEME_KEYS, THEME_LABELS } from '../constants';
import styles from './ThemeSelect.module.scss';

/**
 * Переключатель темы (docs/specs/35-design-system.md §4). Приведение значения
 * `select` к `ThemeKey` безопасно тем же способом, что и в `ListSortSelect`:
 * варианты собраны из той же таблицы `THEME_LABELS`, других значений в
 * разметке нет.
 */
export const ThemeSelect = () => {
  const { theme, selectTheme }: Theme = useTheme();

  return (
    <label className={styles.control}>
      Тема
      <select
        className={styles.select}
        value={theme}
        onChange={(event) => selectTheme(event.target.value as ThemeKey)}
      >
        {THEME_KEYS.map((key) => (
          <option key={key} value={key}>
            {THEME_LABELS[key]}
          </option>
        ))}
      </select>
    </label>
  );
};
