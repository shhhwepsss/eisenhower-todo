import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
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

describe('FUNCTION_IS_SELF_CONTAINED', () => {
  let tempDir: string = '';

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'eisenhower-api-'));
    vi.stubEnv('DATABASE_URL', 'postgresql://user:secret@ep-test.neon.tech/neondb');
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await rm(tempDir, { recursive: true, force: true });
  });

  it('функция API собирается, объявляет маршрут /api/* и отвечает на /api/health', async () => {
    const outDir: string = join(tempDir, 'api');
    const { source, module } = await buildBundle('functions/api.ts', outDir);
    const handler: (request: Request) => Promise<Response> = module.default as (
      request: Request,
    ) => Promise<Response>;
    const request: Request = new Request('http://localhost/api/health');
    const response: Response = await handler(request);

    expect(source).not.toMatch(CORE_IMPORT);
    expect(module.config).toEqual({ path: '/api/*' });
    expect(response.status).toBe(200);
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
