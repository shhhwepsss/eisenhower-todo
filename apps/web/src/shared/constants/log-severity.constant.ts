import type { LogLevel } from '../types/log-level.type';

export const SEVERITY: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
