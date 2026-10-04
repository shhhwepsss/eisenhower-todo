import type { Hono } from 'hono';
import { createApp } from '../src/create-app';
import { forgetEnv } from '../src/lib/env.lib';
import type { AppEnv, DatabaseCheck, DatabaseProbe, Env } from '../src/types';

/**
 * Приложение API с подставной проверкой базы (docs/specs/50-api-skeleton.md,
 * docs/specs/51-db-migrations.md). Настоящая база — в `schema-migrator.test.ts`.
 */
const DATABASE_URL: string = 'postgresql://user:secret@ep-test.neon.tech/neondb';

const DATABASE_ERROR: string = 'relation "app_meta" does not exist';

const HEALTHY: DatabaseCheck = { ok: true };

const createProbe = (check: DatabaseCheck): DatabaseProbe => {
  return { check: async () => check };
};


const createTestApp = (check: DatabaseCheck): Hono<AppEnv> => {
  return createApp({ createDatabaseProbe: () => createProbe(check) });
};

/** Ответ API на запрос к пути под `/api`. */
const requestApi = async (app: Hono<AppEnv>, path: string): Promise<Response> => {
  const request: Request = new Request(`http://localhost${path}`);
  return app.fetch(request);
};

beforeEach(() => {
  vi.stubEnv('DATABASE_URL', DATABASE_URL);
  forgetEnv();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  forgetEnv();
});

describe('API', () => {
  it('/api/health отвечает 200 и версией сборки, когда база в порядке', async () => {
    const app: Hono<AppEnv> = createTestApp(HEALTHY);

    const response: Response = await requestApi(app, '/api/health');
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: 'ok', version: 'dev' });
  });

  it('проверка базы получает адрес из разобранного окружения', async () => {
    const createDatabaseProbe: (env: Env) => DatabaseProbe = vi.fn(() => createProbe(HEALTHY));
    const app: Hono<AppEnv> = createApp({ createDatabaseProbe });

    await requestApi(app, '/api/health');

    expect(createDatabaseProbe).toHaveBeenCalledWith({ DATABASE_URL });
  });

  it('DATABASE_FAILURE_IS_REPORTED: база отказала — 500 без текста ошибки, ошибка в логе', async () => {
    const cause: Error = new Error(DATABASE_ERROR);
    const app: Hono<AppEnv> = createTestApp({ ok: false, reason: 'database_unavailable', cause });
    const consoleError: ReturnType<typeof vi.spyOn> = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response: Response = await requestApi(app, '/api/health');
    const text: string = await response.text();
    const body: unknown = JSON.parse(text);

    expect(response.status).toBe(500);
    expect(body).toEqual({ status: 'database_unavailable', version: 'dev' });
    expect(text).not.toContain('app_meta');
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('проверка базы не прошла'),
      { reason: 'database_unavailable', error: cause },
    );
  });

  it('SCHEMA_MATCHES_CODE: в базе нет миграций кода — 500 со статусом schema_behind', async () => {
    const cause: Error = new Error('в журнале базы нет последней миграции кода');
    const app: Hono<AppEnv> = createTestApp({ ok: false, reason: 'schema_behind', cause });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const response: Response = await requestApi(app, '/api/health');
    const body: unknown = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ status: 'schema_behind', version: 'dev' });
  });

  it('проверка идёт на каждом запросе: результат не запоминается', async () => {
    const check: () => Promise<DatabaseCheck> = vi.fn(async () => HEALTHY);
    const app: Hono<AppEnv> = createApp({ createDatabaseProbe: () => ({ check }) });

    await requestApi(app, '/api/health');
    await requestApi(app, '/api/health');

    expect(check).toHaveBeenCalledTimes(2);
  });

  it('BEHAVIOR_PRESERVED: сбой базы пишет лог областью api/health, один раз', async () => {
    const cause: Error = new Error(DATABASE_ERROR);
    const app: Hono<AppEnv> = createTestApp({ ok: false, reason: 'schema_behind', cause });
    const consoleError: ReturnType<typeof vi.spyOn> = vi.spyOn(console, 'error').mockImplementation(() => {});

    await requestApi(app, '/api/health');

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('[error] [api/health] проверка базы не прошла'),
      { reason: 'schema_behind', error: cause },
    );
  });

  it('BEHAVIOR_PRESERVED: проверка базы бросила исключение — 500 internal, ошибка в логе', async () => {
    const cause: Error = new Error(DATABASE_ERROR);
    const check: () => Promise<DatabaseCheck> = async () => {
      throw cause;
    };
    const app: Hono<AppEnv> = createApp({ createDatabaseProbe: () => ({ check }) });
    const consoleError: ReturnType<typeof vi.spyOn> = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response: Response = await requestApi(app, '/api/health');
    const text: string = await response.text();
    const body: unknown = JSON.parse(text);

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'internal' });
    expect(text).not.toContain('app_meta');
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('[error] [api/app] ручка упала'),
      { method: 'GET', path: '/api/health', error: cause },
    );
  });

  it('BEHAVIOR_PRESERVED: POST на /api/health — 404, ручка только GET', async () => {
    const app: Hono<AppEnv> = createTestApp(HEALTHY);
    const request: Request = new Request('http://localhost/api/health', { method: 'POST' });

    const response: Response = await app.fetch(request);
    const body: unknown = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'not_found' });
  });

  it('неизвестный путь под /api — 404 в JSON, а не HTML', async () => {
    const app: Hono<AppEnv> = createTestApp(HEALTHY);

    const response: Response = await requestApi(app, '/api/unknown');
    const body: unknown = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toMatch(/^application\/json/);
    expect(body).toEqual({ error: 'not_found' });
  });

  it('ONE_ORIGIN: ответ без CORS-заголовков', async () => {
    const app: Hono<AppEnv> = createTestApp(HEALTHY);

    const response: Response = await requestApi(app, '/api/health');

    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('ENV_FAILS_FAST: без DATABASE_URL — 500, в логе имя переменной, к базе не ходим', async () => {
    vi.stubEnv('DATABASE_URL', undefined);
    forgetEnv();
    const createDatabaseProbe: (env: Env) => DatabaseProbe = vi.fn(() => createProbe(HEALTHY));
    const app: Hono<AppEnv> = createApp({ createDatabaseProbe });
    const consoleError: ReturnType<typeof vi.spyOn> = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response: Response = await requestApi(app, '/api/health');
    const body: unknown = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'internal' });
    expect(createDatabaseProbe).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('окружение не разобрано'),
      { variables: ['DATABASE_URL'] },
    );
  });
});
