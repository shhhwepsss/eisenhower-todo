/**
 * Признак pooled-адреса Neon в имени хоста (`ep-…-pooler.…neon.tech`). За ним PgBouncer
 * в режиме транзакций: сессионная блокировка там не привязана к клиенту.
 */
export const NEON_POOLER_MARKER: string = '-pooler';
