import { BRAND_MARK_PATH, TABS } from '../constants';
import { useTabCounts } from '../hooks/use-tab-counts';
import type { AppMenuProps, TabCounts } from '../types';
import { TabIcon } from './TabIcon';
import { ThemeSelect } from './ThemeSelect';
import styles from './AppMenu.module.scss';

/**
 * Левое меню оболочки «Панель» (docs/specs/35-design-system.md, часть 2):
 * бренд, две вкладки со счётчиками, переключатель темы в подвале. Заменяет
 * шапку с `h1` и полосу вкладок.
 *
 * Вкладки остаются вкладками, а не маршрутами: URL у представлений не
 * появляется, поэтому `role="tablist"`/`role="tab"` и связь с панелями через
 * `aria-controls` сохраняются ровно те же, что были у `Tabs`.
 *
 * Счётчик спрятан от скринридера (`aria-hidden`): имя вкладки — её подпись,
 * и «Список 7» вместо «Список» сделало бы имя зависимым от данных. То же число
 * человек слышит внутри вкладки — в заголовке каждой группы.
 *
 * На узком экране меню целиком превращается в нижнюю навигацию — это делает
 * CSS одним брейкпоинтом, без второй разметки: два источника правды о том,
 * что в меню лежит, разошлись бы при первой же правке.
 */
export const AppMenu = ({ activeTab, onSelect, showTabs }: AppMenuProps) => {
  const counts: TabCounts = useTabCounts();

  return (
    <aside className={styles.menu}>
      <div className={styles.brand}>
        <span className={styles.mark}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            focusable="false"
          >
            <path d={BRAND_MARK_PATH} />
          </svg>
        </span>
        <span className={styles.brandName}>Eisenhower</span>
      </div>

      {showTabs && (
        <nav className={styles.nav} role="tablist" aria-label="Представления задач">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-controls={`panel-${id}`}
              aria-selected={id === activeTab}
              className={id === activeTab ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => onSelect(id)}
            >
              <TabIcon tab={id} />
              <span className={styles.tabLabel}>{label}</span>
              <span className={styles.tabCount} aria-hidden="true">
                {counts[id]}
              </span>
            </button>
          ))}
        </nav>
      )}

      <div className={styles.foot}>
        <ThemeSelect />
      </div>
    </aside>
  );
};
