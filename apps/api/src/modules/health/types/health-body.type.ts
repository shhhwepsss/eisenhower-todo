import type { DatabaseFailure } from '../../../types';

/** Тело ответа `/api/health` — то, что видит клиент (docs/specs/51-db-migrations.md). */
export type HealthBody = { status: 'ok' | DatabaseFailure; version: string };
