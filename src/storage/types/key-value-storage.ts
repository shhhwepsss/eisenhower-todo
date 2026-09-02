/**
 * Ровно то, что адаптеру нужно от `localStorage`: положить строку по ключу
 * и взять её обратно.
 *
 * Не `Storage` целиком, потому что `length`, `key(i)` и `clear()` адаптер не зовёт,
 * а требовать их — значит требовать их и от запасного хранилища в памяти, и от
 * подделки в тесте. Узкий тип здесь дешевле: `localStorage` ему соответствует
 * как есть.
 */
export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};
