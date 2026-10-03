import type { z } from 'zod';
import type { ENV_SCHEMA } from '../constants/env-schema.constant';

/** Разобранное окружение: то, что описано в `ENV_SCHEMA`, и ничего сверх. */
export type Env = z.infer<typeof ENV_SCHEMA>;
