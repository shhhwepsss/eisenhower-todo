import { TAB_ICON_PATHS } from '../constants';
import type { TabId } from '../types';

/**
 * Значок вкладки. `aria-hidden`, потому что вкладку называет её подпись:
 * значок здесь — украшение, и второй раз произносить его незачем
 * (COLOR_NOT_ALONE тоже держит подпись, а не картинка).
 */
export const TabIcon = ({ tab }: { tab: TabId }) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={TAB_ICON_PATHS[tab]} />
    </svg>
  );
};
