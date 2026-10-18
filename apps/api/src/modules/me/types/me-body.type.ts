/** Тело ответа `GET /api/me`: кто вошёл. Других полей нет. */
export type MeBody = { id: string; name: string | null; email: string | null };
