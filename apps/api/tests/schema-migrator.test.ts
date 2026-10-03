import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DrizzleSchemaMigrator } from '../src/db/drizzle-schema-migrator';
import { NeonDatabaseProbe } from '../src/db/neon-database-probe';
import type { DatabaseCheck, DatabaseProbe, SchemaMigrator } from '../src/types';
import {
  MIGRATIONS_FOLDER,
  STAND_URL,
  addMigration,
  copyMigrations,
  holdMigrationLock,
  readJournal,
  resetStand,
  tableExists,
  writeMigrationSql,
} from './fixtures/stand';
import type { Row } from './fixtures/stand';

/**
 * Миграции и проверка базы на настоящих драйверах Neon против стенда
 * (docs/specs/51-db-migrations.md). Без `TEST_DATABASE_URL` тесты пропускаются — явно,
 * строкой в выводе, а не молча.
 */
const HAS_STAND: boolean = STAND_URL !== undefined;
const STAND: string = STAND_URL ?? '';

const API_URL: URL = new URL('..', import.meta.url);

const API_ROOT: string = fileURLToPath(API_URL);

const FIRST_TAG: string = '0000_app_meta';

const POOLED_URL: string = 'postgresql://user:secret@ep-test-pooler.eu-central-1.aws.neon.tech/neondb';

/** Заметно дольше, чем длится сам прогон на стенде, и заметно короче таймаута теста. */
const LOCK_HOLD_MS: number = 1500;

const SCRIPT_TIMEOUT_MS: number = 25_000;

const BROKEN_TAG: string = '0001_broken';

/** Первая команда проходит, вторая падает: частичная схема была бы видна по `broken_ok`. */
const BROKEN_SQL: string =
  'CREATE TABLE "broken_ok" ("id" integer);--> statement-breakpoint\nSELECT * FROM "no_such_table";';

const FIXED_SQL: string = 'CREATE TABLE "broken_ok" ("id" integer);';

type ScriptRun = { code: number; output: string };

/** Запускает `npm run db:migrate` как процесс — так же, как его запускает сборка. */
const runMigrateScript = (databaseUrl: string): Promise<ScriptRun> => {
  const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: databaseUrl };
  return new Promise((resolve) => {
    const options: { cwd: string; env: NodeJS.ProcessEnv; timeout: number } = {
      cwd: API_ROOT,
      env,
      timeout: SCRIPT_TIMEOUT_MS,
    };
    execFile(process.execPath, ['scripts/migrate.js'], options, (error, stdout, stderr) => {
      // Нет ошибки — код 0. Ошибка без числового кода (сигнал, таймаут) — тоже сбой.
      const failure: number = typeof error?.code === 'number' ? error.code : 1;
      const code: number = error === null ? 0 : failure;
      resolve({ code, output: `${stdout}${stderr}` });
    });
  });
};

describe.skipIf(!HAS_STAND)('миграции на стенде', () => {
  let tempDir: string = '';

  beforeEach(async () => {
    const prefix: string = join(tmpdir(), 'eisenhower-migrations-');
    tempDir = await mkdtemp(prefix);
    await resetStand();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('пустая база: миграции применены', async () => {
    const migrator: SchemaMigrator = new DrizzleSchemaMigrator(STAND, MIGRATIONS_FOLDER);

    await migrator.migrate();
    const journal: Row[] = await readJournal();
    const hasAppMeta: boolean = await tableExists('app_meta');

    expect(hasAppMeta).toBe(true);
    expect(journal).toHaveLength(1);
  });

  it('MIGRATIONS_ARE_IDEMPOTENT: повторный прогон не меняет журнал', async () => {
    const migrator: SchemaMigrator = new DrizzleSchemaMigrator(STAND, MIGRATIONS_FOLDER);
    await migrator.migrate();
    const before: Row[] = await readJournal();

    await migrator.migrate();
    const after: Row[] = await readJournal();

    expect(after).toEqual(before);
  });

  it('MIGRATION_IS_SERIALIZED: два параллельных прогона применяют миграцию один раз', async () => {
    const first: SchemaMigrator = new DrizzleSchemaMigrator(STAND, MIGRATIONS_FOLDER);
    const second: SchemaMigrator = new DrizzleSchemaMigrator(STAND, MIGRATIONS_FOLDER);

    await Promise.all([first.migrate(), second.migrate()]);
    const journal: Row[] = await readJournal();

    expect(journal).toHaveLength(1);
  });

  it('MIGRATION_IS_SERIALIZED: пока блокировка занята, прогон ждёт и ничего не применяет', async () => {
    const migrator: SchemaMigrator = new DrizzleSchemaMigrator(STAND, MIGRATIONS_FOLDER);
    const release: () => Promise<void> = await holdMigrationLock();
    let finished: boolean = false;

    const run: Promise<void> = migrator.migrate().then(() => {
      finished = true;
    });
    await new Promise((resolve) => setTimeout(resolve, LOCK_HOLD_MS));
    const journalWhileLocked: Row[] = await readJournal();
    const finishedWhileLocked: boolean = finished;
    await release();
    await run;
    const journal: Row[] = await readJournal();

    expect(finishedWhileLocked).toBe(false);
    expect(journalWhileLocked).toEqual([]);
    expect(journal).toHaveLength(1);
  });

  it('NO_MIGRATION_IS_SKIPPED: миграция с меткой времени старше применённой — прогон падает', async () => {
    const applied: SchemaMigrator = new DrizzleSchemaMigrator(STAND, MIGRATIONS_FOLDER);
    await applied.migrate();
    await copyMigrations(tempDir);
    await addMigration(tempDir, '0001_late', FIXED_SQL, 1);
    const migrator: SchemaMigrator = new DrizzleSchemaMigrator(STAND, tempDir);

    await expect(migrator.migrate()).rejects.toThrow('не совпадают с журналом');
    const hasBrokenOk: boolean = await tableExists('broken_ok');

    expect(hasBrokenOk).toBe(false);
  });

  it('NO_MIGRATION_IS_SKIPPED: правка уже применённой миграции — прогон падает', async () => {
    const applied: SchemaMigrator = new DrizzleSchemaMigrator(STAND, MIGRATIONS_FOLDER);
    await applied.migrate();
    await copyMigrations(tempDir);
    await writeMigrationSql(tempDir, FIRST_TAG, 'CREATE TABLE "app_meta" ("key" text);');
    const migrator: SchemaMigrator = new DrizzleSchemaMigrator(STAND, tempDir);

    await expect(migrator.migrate()).rejects.toThrow('не совпадают с журналом');
  });

  it('MIGRATION_IS_ATOMIC: упавший прогон не оставляет ни схемы, ни записей журнала', async () => {
    await copyMigrations(tempDir);
    await addMigration(tempDir, BROKEN_TAG, BROKEN_SQL);
    const migrator: SchemaMigrator = new DrizzleSchemaMigrator(STAND, tempDir);

    await expect(migrator.migrate()).rejects.toThrow();
    const journal: Row[] = await readJournal();
    const hasAppMeta: boolean = await tableExists('app_meta');
    const hasBrokenOk: boolean = await tableExists('broken_ok');

    expect(journal).toEqual([]);
    expect(hasAppMeta).toBe(false);
    expect(hasBrokenOk).toBe(false);
  });

  it('после исправления миграции следующий прогон применяет её', async () => {
    await copyMigrations(tempDir);
    await addMigration(tempDir, BROKEN_TAG, BROKEN_SQL);
    const migrator: SchemaMigrator = new DrizzleSchemaMigrator(STAND, tempDir);
    await expect(migrator.migrate()).rejects.toThrow();

    await writeMigrationSql(tempDir, BROKEN_TAG, FIXED_SQL);
    await migrator.migrate();
    const journal: Row[] = await readJournal();
    const hasBrokenOk: boolean = await tableExists('broken_ok');

    expect(journal).toHaveLength(2);
    expect(hasBrokenOk).toBe(true);
  });

  it('упавший прогон отпускает блокировку: следующий не зависает', async () => {
    await copyMigrations(tempDir);
    await addMigration(tempDir, BROKEN_TAG, BROKEN_SQL);
    const broken: SchemaMigrator = new DrizzleSchemaMigrator(STAND, tempDir);
    await expect(broken.migrate()).rejects.toThrow();

    const healthy: SchemaMigrator = new DrizzleSchemaMigrator(STAND, MIGRATIONS_FOLDER);
    await healthy.migrate();
    const journal: Row[] = await readJournal();

    expect(journal).toHaveLength(1);
  });

  it('проверка базы: без схемы — ошибка, после миграции — ok', async () => {
    const probe: DatabaseProbe = new NeonDatabaseProbe(STAND);
    const migrator: SchemaMigrator = new DrizzleSchemaMigrator(STAND, MIGRATIONS_FOLDER);

    const before: DatabaseCheck = await probe.check();
    await migrator.migrate();
    const after: DatabaseCheck = await probe.check();

    expect(before.ok).toBe(false);
    expect(after).toEqual({ ok: true });
  });

  it('DATABASE_FAILURE_IS_REPORTED: база не успела ответить — проверка не ждёт дольше предела', async () => {
    const migrator: SchemaMigrator = new DrizzleSchemaMigrator(STAND, MIGRATIONS_FOLDER);
    await migrator.migrate();
    const probe: DatabaseProbe = new NeonDatabaseProbe(STAND, 0);

    const check: DatabaseCheck = await probe.check();

    expect(check.ok).toBe(false);
  });

  it('db:migrate на пустой базе: код выхода 0, миграции применены', async () => {
    const run: ScriptRun = await runMigrateScript(STAND);
    const journal: Row[] = await readJournal();

    expect(run.code).toBe(0);
    expect(journal).toHaveLength(1);
  }, 30_000);

  it('FAILED_MIGRATION_FAILS_BUILD: база отказала — код выхода не 0, ошибка в логе', async () => {
    const wrongPassword: string = STAND.replace(':postgres@', ':wrong@');

    const run: ScriptRun = await runMigrateScript(wrongPassword);

    expect(run.code).not.toBe(0);
    expect(run.output).toContain('миграции не применены');
  }, 30_000);
});

describe.skipIf(HAS_STAND)('стенд базы не задан', () => {
  it('интеграционные тесты пропущены: нет TEST_DATABASE_URL', () => {
    console.warn(
      'Интеграционные тесты базы пропущены: не задан TEST_DATABASE_URL ' +
        '(стенд — apps/api/stand/docker-compose.yml).',
    );
  });
});

describe('миграции без базы', () => {
  it('pooled-адрес Neon отклоняется до подключения', async () => {
    const migrator: SchemaMigrator = new DrizzleSchemaMigrator(POOLED_URL, MIGRATIONS_FOLDER);

    await expect(migrator.migrate()).rejects.toThrow('прямой адрес базы');
  });
});

describe('db:migrate без базы', () => {
  it('FAILED_MIGRATION_FAILS_BUILD: окружение не разобрано — код выхода не 0', async () => {
    const run: ScriptRun = await runMigrateScript('https://todo-eisenhower.netlify.app');

    expect(run.code).not.toBe(0);
    expect(run.output).toContain('окружение не разобрано');
  }, 30_000);
});
