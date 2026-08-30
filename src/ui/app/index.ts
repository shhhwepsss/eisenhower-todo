// Публичный контракт слайса: снаружи видно только это.
// App.tsx, children/, hooks/, helpers/, constants/ и types/ — внутренности,
// импорт мимо index.ts запрещён линтером (SLICE_PUBLIC_API в eslint.config.js).
export { App } from './App';
export type { TabId } from './types';
