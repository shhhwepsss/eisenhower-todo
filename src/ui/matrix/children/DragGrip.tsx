/**
 * Знак «меня можно тянуть». Только глиф, без кнопки и без слушателей: один и тот
 * же грип нужен и настоящей ручке (`SortableCard`), и копии карточки, которая
 * летит за указателем (`DragPreview`). У копии кнопки быть не должно — она
 * `aria-hidden` и нажимать в ней нечего, — поэтому делится именно глиф.
 */
export const DragGrip = () => {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  );
};
