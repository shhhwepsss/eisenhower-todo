import { cp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@neondatabase/serverless';
import { MIGRATION_LOCK_KEY } from '../../src/db/constants/migration-lock.constant';
import { STAND_HOST } from '../../src/db/constants/neon-stand.constant';
import { configureNeonFor } from '../../src/db/neon-stand';

/**
 * Стенд базы для интеграционных тестов (docs/specs/51-db-migrations.md). Тесты смотрят в
 * базу напрямую, своим соединением: проверять migrator его же глазами — значит
 * унаследовать его ошибки.
 */
export const STAND_URL: string | undefined = process.env.TEST_DATABASE_URL;

const MIGRATIONS_URL: URL = new URL('../../drizzle', import.meta.url);

export const MIGRATIONS_FOLDER: string = fileURLToPath(MIGRATIONS_URL);

export type Row = Record<string, unknown>;

type JournalEntry = { idx: number; version: string; when: number; tag: string; breakpoints: boolean };

type Journal = { version: string; dialect: string; entries: JournalEntry[] };

/**
 * Адрес стенда; вызывается только из тестов, которые без стенда пропущены.
 *
 * Тесты стирают базу целиком, поэтому любой адрес, кроме стенда, отклоняется:
 * dev-ветка Neon в `TEST_DATABASE_URL` не должна стоить данных.
 */
const requireStandUrl = (): string => {
  if (STAND_URL === undefined) throw new Error('TEST_DATABASE_URL не задан');
  const url: URL = new URL(STAND_URL);
  if (url.hostname !== STAND_HOST) {
    throw new Error(`TEST_DATABASE_URL должен указывать на стенд (${STAND_HOST}): тесты стирают базу`);
  }
  return STAND_URL;
};

const connectToStand = async (): Promise<Client> => {
  const url: string = requireStandUrl();
  configureNeonFor(url);
  const client: Client = new Client(url);
  await client.connect();
  return client;
};

export const queryStand = async (text: string): Promise<Row[]> => {
  const client: Client = await connectToStand();
  try {
    const result: { rows: Row[] } = await client.query(text);
    return result.rows;
  } finally {
    await client.end();
  }
};

/**
 * Занимает блокировку миграций чужой сессией и возвращает функцию, которая её
 * отпускает, — так прогон можно застать ждущим, а не надеяться на совпадение по времени.
 */
export const holdMigrationLock = async (): Promise<() => Promise<void>> => {
  const client: Client = await connectToStand();
  await client.query(`select pg_advisory_lock(${MIGRATION_LOCK_KEY})`);
  return () => client.end();
};

/** Пустая база: ни таблиц приложения, ни журнала миграций. */
export const resetStand = async (): Promise<void> => {
  await queryStand('drop schema if exists drizzle cascade');
  await queryStand('drop schema if exists public cascade');
  await queryStand('create schema public');
};

export const tableExists = async (name: string): Promise<boolean> => {
  const rows: Row[] = await queryStand(`select to_regclass('public.${name}') is not null as found`);
  return rows[0]?.found === true;
};

/** Записи журнала миграций; пустой список, если журнала ещё нет. */
export const readJournal = async (): Promise<Row[]> => {
  const found: Row[] = await queryStand(
    "select to_regclass('drizzle.__drizzle_migrations') is not null as found",
  );
  if (found[0]?.found !== true) return [];
  return queryStand('select id, hash, created_at from drizzle.__drizzle_migrations order by id');
};

/** Копия настоящих миграций: тест дописывает свои, не трогая `apps/api/drizzle/`. */
export const copyMigrations = async (folder: string): Promise<void> => {
  await cp(MIGRATIONS_FOLDER, folder, { recursive: true });
};

/**
 * Дописывает миграцию в папку: файл SQL и запись в журнале drizzle-kit. `when` по
 * умолчанию — на секунду позже последней записи, как у только что сгенерированной.
 */
export const addMigration = async (
  folder: string,
  tag: string,
  sql: string,
  when?: number,
): Promise<void> => {
  const journalPath: string = join(folder, 'meta', '_journal.json');
  const journalText: string = await readFile(journalPath, 'utf8');
  const journal: Journal = JSON.parse(journalText) as Journal;
  const last: JournalEntry | undefined = journal.entries.at(-1);
  const idx: number = journal.entries.length;
  const stamp: number = when ?? (last?.when ?? 0) + 1000;
  journal.entries.push({ idx, version: journal.version, when: stamp, tag, breakpoints: true });
  await writeFile(journalPath, JSON.stringify(journal, null, 2));
  await writeMigrationSql(folder, tag, sql);
};

export const writeMigrationSql = async (folder: string, tag: string, sql: string): Promise<void> => {
  const sqlPath: string = join(folder, `${tag}.sql`);
  await writeFile(sqlPath, sql);
};
