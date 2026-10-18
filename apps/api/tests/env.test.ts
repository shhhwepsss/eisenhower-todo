import { parseEnv, parseMigrationEnv } from '../src/lib/env.lib';
import type { EnvResult, MigrationEnvResult } from '../src/types';
import { AUTH_ENV } from './fixtures/auth';

/** ENV_FAILS_FAST (docs/specs/51-db-migrations.md): разбор окружения по схеме. */
const VALID_URL: string = 'postgresql://user:secret@ep-test.neon.tech/neondb?sslmode=require';

describe('parseEnv', () => {
  it('принимает строку подключения Postgres', () => {
    const result: EnvResult = parseEnv({ DATABASE_URL: VALID_URL, ...AUTH_ENV });

    expect(result).toEqual({ ok: true, env: { DATABASE_URL: VALID_URL, ...AUTH_ENV } });
  });

  it('называет незаданную переменную', () => {
    const result: EnvResult = parseEnv({ ...AUTH_ENV });

    expect(result).toEqual({ ok: false, variables: ['DATABASE_URL'] });
  });

  it('отклоняет адрес не базы, а сайта', () => {
    const result: EnvResult = parseEnv({ DATABASE_URL: 'https://todo-eisenhower.netlify.app', ...AUTH_ENV });

    expect(result).toEqual({ ok: false, variables: ['DATABASE_URL'] });
  });

  it('не возвращает значения переменных — только имена', () => {
    const result: EnvResult = parseEnv({ DATABASE_URL: 'postgresql://user:secret@' });
    const serialized: string = JSON.stringify(result);

    expect(serialized).not.toContain('secret');
  });

  it.each(['AUTH_SECRET', 'AUTH_URL', 'AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET'])(
    'ENV_FAILS_FAST: без %s разбор называет её',
    (variable: string) => {
      const source: Record<string, string | undefined> = { DATABASE_URL: VALID_URL, ...AUTH_ENV, [variable]: undefined };
      const result: EnvResult = parseEnv(source);

      expect(result).toEqual({ ok: false, variables: [variable] });
    },
  );

  it('отклоняет AUTH_SECRET короче 32 символов', () => {
    const result: EnvResult = parseEnv({ DATABASE_URL: VALID_URL, ...AUTH_ENV, AUTH_SECRET: 'short' });

    expect(result).toEqual({ ok: false, variables: ['AUTH_SECRET'] });
  });

  it.each(['http://localhost/api', 'http://localhost/auth', 'http://localhost', 'ftp://localhost/api/auth', 'not a url', '', 'http://'])(
    'отклоняет AUTH_URL %s: путь должен быть /api/auth, протокол — http или https',
    (authUrl: string) => {
      const result: EnvResult = parseEnv({ DATABASE_URL: VALID_URL, ...AUTH_ENV, AUTH_URL: authUrl });

      expect(result).toEqual({ ok: false, variables: ['AUTH_URL'] });
    },
  );
});

describe('parseMigrationEnv', () => {
  it('прогону миграций хватает DATABASE_URL: секреты входа ему не нужны', () => {
    const result: MigrationEnvResult = parseMigrationEnv({ DATABASE_URL: VALID_URL });

    expect(result).toEqual({ ok: true, env: { DATABASE_URL: VALID_URL } });
  });

  it('называет незаданную DATABASE_URL', () => {
    const result: MigrationEnvResult = parseMigrationEnv({ ...AUTH_ENV });

    expect(result).toEqual({ ok: false, variables: ['DATABASE_URL'] });
  });
});
