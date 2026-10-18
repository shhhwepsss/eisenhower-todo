import type { Context, Hono } from 'hono';
import { createApp } from '../src/create-app';
import { forgetEnv } from '../src/lib/env.lib';
import type { AppEnv, DatabaseProbe, ErrorBody } from '../src/types';
import {
  AUTH_ENV,
  OTHER_SECRET,
  SECURE_SESSION_COOKIE,
  SESSION_COOKIE,
  SESSION_USER,
  createUnreachableAdapter,
  sessionCookieOf,
  stubAuthEnv,
} from './fixtures/auth';
import type { UnreachableAdapter } from './fixtures/auth';

/**
 * Вход и сессия (docs/specs/52-google-auth.md): `requireSession`, `OPEN_ROUTES`,
 * `GET /api/me` и ручки Auth.js. База во всех тестах недоступна: проверка сессии в неё
 * не ходит (SESSION_CHECK_SKIPS_DATABASE), а вход через Google проверяется руками.
 */
const DATABASE_URL: string = 'postgresql://user:secret@ep-test.neon.tech/neondb';

const HEALTHY_PROBE: DatabaseProbe = { check: async () => ({ ok: true }) };

type TestApp = { app: Hono<AppEnv>; database: UnreachableAdapter };

const createTestApp = (): TestApp => {
  const database: UnreachableAdapter = createUnreachableAdapter();
  const app: Hono<AppEnv> = createApp({
    createDatabaseProbe: () => HEALTHY_PROBE,
    createAuthAdapter: () => database.adapter,
  });
  return { app, database };
};

const requestApi = async (app: Hono<AppEnv>, path: string, init: RequestInit = {}): Promise<Response> => {
  const request: Request = new Request(`http://localhost${path}`, init);
  return app.fetch(request);
};

const withCookie = (cookie: string): RequestInit => ({ headers: { cookie } });

const UNAUTHORIZED: ErrorBody = { error: 'unauthorized' };

const NOT_FOUND: ErrorBody = { error: 'not_found' };

beforeEach(() => {
  vi.stubEnv('DATABASE_URL', DATABASE_URL);
  stubAuthEnv();
  forgetEnv();
  // Отклонённые cookie пишутся в лог предупреждением; здесь это ожидаемо.
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  forgetEnv();
});

describe('AUTH_REQUIRED_BY_DEFAULT: /api/me', () => {
  it('без cookie — 401 unauthorized', async () => {
    const { app } = createTestApp();

    const response: Response = await requestApi(app, '/api/me');
    const body: unknown = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual(UNAUTHORIZED);
  });

  it('cookie, подписанная другим секретом, — 401', async () => {
    const { app } = createTestApp();
    const cookie: string = await sessionCookieOf({ secret: OTHER_SECRET });

    const response: Response = await requestApi(app, '/api/me', withCookie(cookie));

    expect(response.status).toBe(401);
  });

  it('испорченная cookie — 401', async () => {
    const { app } = createTestApp();
    const cookie: string = await sessionCookieOf();
    const tampered: string = `${cookie.slice(0, -4)}AAAA`;

    const response: Response = await requestApi(app, '/api/me', withCookie(tampered));

    expect(response.status).toBe(401);
  });

  it('отклонённая cookie — warn в логе, а не error', async () => {
    const { app } = createTestApp();
    const cookie: string = await sessionCookieOf({ secret: OTHER_SECRET });
    const consoleWarn: ReturnType<typeof vi.spyOn> = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleError: ReturnType<typeof vi.spyOn> = vi.spyOn(console, 'error').mockImplementation(() => {});

    await requestApi(app, '/api/me', withCookie(cookie));

    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('[warn] [api/auth] Auth.js: запрос отклонён'), {
      type: 'JWTSessionError',
    });
  });

  it('просроченная cookie — 401', async () => {
    const { app } = createTestApp();
    // Auth.js прощает расхождение часов в 15 секунд — срок вышел минуту назад.
    const cookie: string = await sessionCookieOf({ maxAge: -60 });

    const response: Response = await requestApi(app, '/api/me', withCookie(cookie));

    expect(response.status).toBe(401);
  });

  it('валидная cookie — 200 с id, name, email и без других полей', async () => {
    const { app } = createTestApp();
    const cookie: string = await sessionCookieOf();

    const response: Response = await requestApi(app, '/api/me', withCookie(cookie));
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(SESSION_USER);
  });

  it('SESSION_CHECK_SKIPS_DATABASE: база недоступна — 200, адаптер не вызван', async () => {
    const { app, database } = createTestApp();
    const cookie: string = await sessionCookieOf();

    const response: Response = await requestApi(app, '/api/me', withCookie(cookie));

    expect(response.status).toBe(200);
    expect(database.calls).toEqual([]);
  });

  it('идемпотентность: два GET /api/me подряд дают одинаковый ответ, база не тронута', async () => {
    const { app, database } = createTestApp();
    const cookie: string = await sessionCookieOf();

    const first: Response = await requestApi(app, '/api/me', withCookie(cookie));
    const second: Response = await requestApi(app, '/api/me', withCookie(cookie));
    const firstBody: unknown = await first.json();
    const secondBody: unknown = await second.json();

    expect(second.status).toBe(first.status);
    expect(secondBody).toEqual(firstBody);
    expect(database.calls).toEqual([]);
  });

  it('ручка, зарегистрированная без записи в OPEN_ROUTES, без сессии — 401', async () => {
    const { app } = createTestApp();
    app.get('/probe', (context: Context<AppEnv>): Response => context.json({ reached: true }));

    const response: Response = await requestApi(app, '/api/probe');

    expect(response.status).toBe(401);
  });

  it('новый метод на открытом пути закрыт: открывается пара «метод + путь»', async () => {
    const { app } = createTestApp();
    app.post('/health', (context: Context<AppEnv>): Response => context.json({ reached: true }));

    const response: Response = await requestApi(app, '/api/health', { method: 'POST' });

    expect(response.status).toBe(401);
  });

  it('ручка через app.all тоже закрыта: ALL — не признак middleware', async () => {
    const { app } = createTestApp();
    app.all('/probe-all', (context: Context<AppEnv>): Response => context.json({ reached: true }));

    const response: Response = await requestApi(app, '/api/probe-all');

    expect(response.status).toBe(401);
  });

  it('каждый маршрут ALL — глобальный middleware: новый ALL-маршрут роняет этот тест', () => {
    const { app } = createTestApp();
    const allRoutes: string[] = app.routes
      .filter((route: { method: string }) => route.method === 'ALL')
      .map((route: { path: string }) => route.path);

    // requireEnv, конфиг Auth.js, requireSession — ровно три, все на /api/*.
    expect(allRoutes).toEqual(['/api/*', '/api/*', '/api/*']);
  });
});

describe('OPEN_ROUTES', () => {
  it('/api/health без cookie — ответ как до задачи', async () => {
    const { app } = createTestApp();

    const response: Response = await requestApi(app, '/api/health');
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: 'ok', version: 'dev' });
  });

  it('/api/auth/signin без cookie — не 401, страница входа', async () => {
    const { app } = createTestApp();

    const response: Response = await requestApi(app, '/api/auth/signin');
    const html: string = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('/api/auth/signin/google');
  });
});

describe('UNKNOWN_PATH_IS_NOT_FOUND', () => {
  it('неизвестный путь без cookie — 404 not_found', async () => {
    const { app } = createTestApp();

    const response: Response = await requestApi(app, '/api/unknown');
    const body: unknown = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual(NOT_FOUND);
  });

  it('неизвестный путь с валидной cookie — 404 not_found', async () => {
    const { app } = createTestApp();
    const cookie: string = await sessionCookieOf();

    const response: Response = await requestApi(app, '/api/unknown', withCookie(cookie));
    const body: unknown = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual(NOT_FOUND);
  });

  it.each(['/api/health', '/api/me'])('POST %s без cookie — 404: ручка только GET', async (path: string) => {
    const { app } = createTestApp();

    const response: Response = await requestApi(app, path, { method: 'POST' });
    const body: unknown = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual(NOT_FOUND);
  });
});

describe('срок сессии', () => {
  it('/api/auth/session выпускает новый JWT, /api/me — нет', async () => {
    const { app } = createTestApp();
    const cookie: string = await sessionCookieOf();

    const session: Response = await requestApi(app, '/api/auth/session', withCookie(cookie));
    const me: Response = await requestApi(app, '/api/me', withCookie(cookie));
    const sessionCookies: string[] = session.headers.getSetCookie();
    const meCookies: string[] = me.headers.getSetCookie();
    const renewed: string | undefined = sessionCookies.find((header: string) => header.startsWith(`${SESSION_COOKIE}=`));
    const cookieValue: string = cookie.slice(SESSION_COOKIE.length + 1);

    expect(renewed).toBeDefined();
    expect(renewed).not.toContain(cookieValue);
    expect(meCookies).toEqual([]);
  });
});

describe('SESSION_COOKIE_IS_HARDENED', () => {
  it('AUTH_URL по https — cookie сессии HttpOnly, Secure, SameSite=Lax, префикс __Secure-', async () => {
    vi.stubEnv('AUTH_URL', 'https://todo.example.com/api/auth');
    forgetEnv();
    const { app } = createTestApp();
    const cookie: string = await sessionCookieOf({ cookieName: SECURE_SESSION_COOKIE });

    const response: Response = await requestApi(app, '/api/auth/session', withCookie(cookie));
    const cookies: string[] = response.headers.getSetCookie();
    const sessionCookie: string | undefined = cookies.find((header: string) =>
      header.startsWith(`${SECURE_SESSION_COOKIE}=`),
    );

    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toMatch(/;\s*HttpOnly/i);
    expect(sessionCookie).toMatch(/;\s*Secure/i);
    expect(sessionCookie).toMatch(/;\s*SameSite=Lax/i);
  });

  it('AUTH_URL по http — HttpOnly и SameSite=Lax, без Secure', async () => {
    const { app } = createTestApp();
    const cookie: string = await sessionCookieOf();

    const response: Response = await requestApi(app, '/api/auth/session', withCookie(cookie));
    const cookies: string[] = response.headers.getSetCookie();
    const sessionCookie: string | undefined = cookies.find((header: string) => header.startsWith(`${SESSION_COOKIE}=`));

    expect(sessionCookie).toMatch(/;\s*HttpOnly/i);
    expect(sessionCookie).toMatch(/;\s*SameSite=Lax/i);
    expect(sessionCookie).not.toMatch(/;\s*Secure/i);
  });
});

describe('ENV_FAILS_FAST: переменные входа', () => {
  it.each(['AUTH_SECRET', 'AUTH_URL', 'AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET'])(
    'без %s — 500 internal, в логе имя переменной',
    async (variable: string) => {
      vi.stubEnv(variable, undefined);
      forgetEnv();
      const { app } = createTestApp();
      const consoleError: ReturnType<typeof vi.spyOn> = vi.spyOn(console, 'error').mockImplementation(() => {});

      const response: Response = await requestApi(app, '/api/me');
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ error: 'internal' });
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('окружение не разобрано'), {
        variables: [variable],
      });
    },
  );
});

describe('логи Auth.js', () => {
  it('вход через Google не пишет в лог ни секрет клиента, ни отладку Auth.js', async () => {
    const { app } = createTestApp();
    const consoleDebug: ReturnType<typeof vi.spyOn> = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const consoleInfo: ReturnType<typeof vi.spyOn> = vi.spyOn(console, 'info').mockImplementation(() => {});
    const csrf: Response = await requestApi(app, '/api/auth/csrf');
    const { csrfToken } = (await csrf.json()) as { csrfToken: string };
    const csrfCookies: string = csrf.headers
      .getSetCookie()
      .map((header: string) => header.split(';')[0])
      .join('; ');
    const form: URLSearchParams = new URLSearchParams({ csrfToken });

    const response: Response = await requestApi(app, '/api/auth/signin/google', {
      method: 'POST',
      headers: { cookie: csrfCookies, 'content-type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    const written: string = JSON.stringify([...consoleDebug.mock.calls, ...consoleInfo.mock.calls]);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toMatch(/^https:\/\/accounts\.google\.com\//);
    expect(written).not.toContain(AUTH_ENV.AUTH_GOOGLE_SECRET);
    expect(written).not.toContain('Auth.js');
  });

  it('неизвестное действие Auth.js — warn с типом, а не error', async () => {
    const { app } = createTestApp();
    const consoleWarn: ReturnType<typeof vi.spyOn> = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleError: ReturnType<typeof vi.spyOn> = vi.spyOn(console, 'error').mockImplementation(() => {});

    await requestApi(app, '/api/auth/nope');

    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('Auth.js: запрос отклонён'), {
      type: 'UnknownAction',
    });
  });
});
