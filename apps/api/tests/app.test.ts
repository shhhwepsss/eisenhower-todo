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

const UNAVAILABLE: DatabaseCheck = { ok: false, cause: new Error(DATABASE_ERROR) };

const TTL_MS: number = 60_000;

/** Проверка, которая отдаёт заданные результаты по очереди и считает обращения. */
const createCountingApp = (checks: DatabaseCheck[]): { app: Hono<AppEnv>; check: () => Promise<DatabaseCheck> } => {
  const check: () => Promise<DatabaseCheck> = vi.fn(async () => checks.shift() ?? HEALTHY);
  const app: Hono<AppEnv> = createApp({ createDatabaseProbe: () => ({ check }) });
  return { app, check };
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
  vi.useRealTimers();
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
    const app: Hono<AppEnv> = createTestApp({ ok: false, cause });
    const consoleError: ReturnType<typeof vi.spyOn> = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response: Response = await requestApi(app, '/api/health');
    const text: string = await response.text();
    const body: unknown = JSON.parse(text);

    expect(response.status).toBe(500);
    expect(body).toEqual({ status: 'database_unavailable', version: 'dev' });
    expect(text).not.toContain('app_meta');
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('база недоступна или схема не применена'),
      { error: cause },
    );
  });

  it('DATABASE_CHECK_IS_CACHED: пока срок не вышел, повторный запрос в базу не ходит', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { app, check } = createCountingApp([HEALTHY, HEALTHY]);

    await requestApi(app, '/api/health');
    vi.advanceTimersByTime(TTL_MS - 1);
    const response: Response = await requestApi(app, '/api/health');

    expect(response.status).toBe(200);
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('DATABASE_CHECK_IS_CACHED: срок вышел — база проверяется заново', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { app, check } = createCountingApp([HEALTHY, UNAVAILABLE]);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await requestApi(app, '/api/health');
    vi.advanceTimersByTime(TTL_MS);
    const response: Response = await requestApi(app, '/api/health');

    expect(response.status).toBe(500);
    expect(check).toHaveBeenCalledTimes(2);
  });

  it('DATABASE_CHECK_IS_CACHED: сбой не запоминается — база вернулась, и это видно сразу', async () => {
    const { app, check } = createCountingApp([UNAVAILABLE, HEALTHY]);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const failed: Response = await requestApi(app, '/api/health');
    const recovered: Response = await requestApi(app, '/api/health');

    expect(failed.status).toBe(500);
    expect(recovered.status).toBe(200);
    expect(check).toHaveBeenCalledTimes(2);
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
