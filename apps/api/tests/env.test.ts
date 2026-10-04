import { parseEnv } from '../src/lib/env.lib';
import type { EnvResult } from '../src/types';

/** ENV_FAILS_FAST (docs/specs/51-db-migrations.md): разбор окружения по схеме. */
const VALID_URL: string = 'postgresql://user:secret@ep-test.neon.tech/neondb?sslmode=require';

describe('parseEnv', () => {
  it('принимает строку подключения Postgres', () => {
    const result: EnvResult = parseEnv({ DATABASE_URL: VALID_URL });

    expect(result).toEqual({ ok: true, env: { DATABASE_URL: VALID_URL } });
  });

  it('называет незаданную переменную', () => {
    const result: EnvResult = parseEnv({});

    expect(result).toEqual({ ok: false, variables: ['DATABASE_URL'] });
  });

  it('отклоняет адрес не базы, а сайта', () => {
    const result: EnvResult = parseEnv({ DATABASE_URL: 'https://todo-eisenhower.netlify.app' });

    expect(result).toEqual({ ok: false, variables: ['DATABASE_URL'] });
  });

  it('не возвращает значения переменных — только имена', () => {
    const result: EnvResult = parseEnv({ DATABASE_URL: 'postgresql://user:secret@' });
    const serialized: string = JSON.stringify(result);

    expect(serialized).not.toContain('secret');
  });
});
