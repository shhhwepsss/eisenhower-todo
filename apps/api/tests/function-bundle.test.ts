import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';

/**
 * FUNCTION_IS_SELF_CONTAINED (docs/specs/50-api-skeleton.md): бандлер функций Netlify
 * оставляет внешними все пакеты, а `@eisenhower/core` — исходники на TypeScript. Если
 * core не вклеен в собранную функцию, сборка остаётся зелёной, а функция падает на
 * первом запросе. Поэтому проверяется собранный файл: что в нём нет импорта core и
 * что он запускается в Node.
 */
const API_ROOT: string = fileURLToPath(new URL('..', import.meta.url));

type Bundle = { source: string; module: Record<string, unknown> };

/** Собирает `entry` конфигом API во временную папку и загружает результат в Node. */
const buildBundle = async (entry: string, outDir: string): Promise<Bundle> => {
  await build({ root: API_ROOT, logLevel: 'silent', build: { ssr: entry, outDir } });
  const bundlePath: string = join(outDir, 'api.mjs');
  const source: string = await readFile(bundlePath, 'utf8');
  const bundleUrl: string = pathToFileURL(bundlePath).href;
  const module: Record<string, unknown> = await import(/* @vite-ignore */ bundleUrl);
  return { source, module };
};

const CORE_IMPORT: RegExp = /from\s+["']@eisenhower\/core["']/;

/** Рабочий драйвер в функции есть — иначе проверка следов миграций ничего не доказывает. */
const NEON_HTTP_IMPORT: RegExp = /["']drizzle-orm\/neon-http["']/;

/**
 * Следы миграций (docs/specs/51-db-migrations.md): путь модуля WebSocket-драйвера или
 * migrator drizzle в кавычках — любой вид импорта, блокировка прогона, SQL из
 * `apps/api/drizzle/`. Путь в кавычках, а не слово: комментарии исходников в сборке
 * остаются.
 */
const MIGRATION_TRACES: RegExp =
  /["'][^"'\s]*(neon-serverless|migrator)[^"'\s]*["']|pg_advisory_lock|CREATE TABLE/;

/**
 * Хеш последней миграции, посчитанный мимо кода сборки: sha256 файла, который журнал
 * drizzle-kit называет последним. Так же его считает migrator, когда пишет журнал базы.
 */
const readLatestMigrationHash = async (): Promise<string> => {
  const journalPath: string = join(API_ROOT, 'drizzle', 'meta', '_journal.json');
  const journalText: string = await readFile(journalPath, 'utf8');
  const journal: { entries: { tag: string }[] } = JSON.parse(journalText);
  const latest: { tag: string } | undefined = journal.entries.at(-1);
  if (latest === undefined) throw new Error('в журнале drizzle-kit нет миграций');
  const migrationPath: string = join(API_ROOT, 'drizzle', `${latest.tag}.sql`);
  const migrationSql: string = await readFile(migrationPath, 'utf8');
  return createHash('sha256').update(migrationSql).digest('hex');
};

describe('FUNCTION_IS_SELF_CONTAINED', () => {
  let tempDir: string = '';

  beforeAll(async () => {
    // Внутри пакета, а не в системной временной папке: собранная функция импортирует
    // внешние пакеты (`hono`, `zod`, `drizzle-orm`), и Node ищет их вверх от файла. Из
    // системной папки он нашёл бы чужие версии или не нашёл бы ничего.
    const distDir: string = join(API_ROOT, 'dist');
    await mkdir(distDir, { recursive: true });
    tempDir = await mkdtemp(join(distDir, 'test-bundle-'));
    vi.stubEnv('DATABASE_URL', 'postgresql://user:secret@ep-test.neon.tech/neondb');
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await rm(tempDir, { recursive: true, force: true });
  });

  // Запрос идёт на неизвестный путь, а не на `/api/health`: тот ходит в базу
  // (docs/specs/51-db-migrations.md), а здесь проверяется, что функция запускается.
  it('функция API собирается, объявляет маршрут /api/* и отвечает на запрос', async () => {
    const outDir: string = join(tempDir, 'api');
    const { source, module } = await buildBundle('functions/api.ts', outDir);
    const handler: (request: Request) => Promise<Response> = module.default as (
      request: Request,
    ) => Promise<Response>;
    const request: Request = new Request('http://localhost/api/unknown');
    const response: Response = await handler(request);
    const body: unknown = await response.json();

    expect(source).not.toMatch(CORE_IMPORT);
    expect(module.config).toEqual({ path: '/api/*' });
    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'not_found' });
  }, 30_000);

  it('MIGRATIONS_STAY_OUT_OF_FUNCTION: в функции нет ни SQL миграций, ни migrator', async () => {
    const outDir: string = join(tempDir, 'api-migrations');
    const { source } = await buildBundle('functions/api.ts', outDir);

    expect(source).toMatch(NEON_HTTP_IMPORT);
    expect(source).not.toMatch(MIGRATION_TRACES);
  }, 30_000);

  // Хеш доезжает до функции только если `app.ts` передал его проверке базы: иначе
  // константа не используется и сборка её выбрасывает.
  it('SCHEMA_MATCHES_CODE: в функцию вклеен хеш последней миграции', async () => {
    const outDir: string = join(tempDir, 'api-hash');
    const { source } = await buildBundle('functions/api.ts', outDir);
    const latestMigrationHash: string = await readLatestMigrationHash();

    expect(source).toContain(latestMigrationHash);
  }, 30_000);

  it('код, который пользуется core, собирается с core внутри и исполняется в Node', async () => {
    const outDir: string = join(tempDir, 'core-consumer');
    const { source, module } = await buildBundle('tests/fixtures/core-consumer.ts', outDir);
    const resolveFixtureZone: () => string = module.default as () => string;
    const zone: string = resolveFixtureZone();

    expect(source).not.toMatch(CORE_IMPORT);
    expect(zone).toBe('inbox');
  }, 30_000);
});
