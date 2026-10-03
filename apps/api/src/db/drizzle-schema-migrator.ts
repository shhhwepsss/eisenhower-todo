import { Client } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import type { MigrationMeta } from 'drizzle-orm/migrator';
import { drizzle } from 'drizzle-orm/neon-serverless';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import type { SchemaMigrator } from '../types';
import { MIGRATION_LOCK_KEY, MIGRATION_LOCK_TIMEOUT_MS } from './constants/migration-lock.constant';
import { NEON_POOLER_MARKER } from './constants/neon-pooler.constant';
import { configureNeonFor } from './neon-stand';

/**
 * Миграции через WebSocket-драйвер Neon (docs/specs/51-db-migrations.md).
 *
 * Одно соединение на весь прогон: на нём берётся `pg_advisory_lock`, на нём же migrator
 * drizzle открывает транзакцию. Migrator читает «последнюю применённую» до своей
 * транзакции, поэтому второй прогон обязан ждать блокировку, а не транзакцию
 * (MIGRATION_IS_SERIALIZED). Сам прогон — одна транзакция (MIGRATION_IS_ATOMIC).
 *
 * Блокировка сессионная и явно не снимается: её отпускает закрытие соединения — в том
 * числе когда прогон упал или соединение оборвалось.
 */
export class DrizzleSchemaMigrator implements SchemaMigrator {
  private readonly databaseUrl: string;
  private readonly migrationsFolder: string;

  constructor(databaseUrl: string, migrationsFolder: string) {
    this.databaseUrl = databaseUrl;
    this.migrationsFolder = migrationsFolder;
  }

  public async migrate(): Promise<void> {
    this.assertDirectConnection();
    configureNeonFor(this.databaseUrl);
    const client: Client = new Client(this.databaseUrl);
    // Обрыв соединения драйвер сообщает ещё и событием. Без слушателя Node уронил бы
    // процесс мимо обработки ошибок; сама ошибка приходит в запрос, который её ждал.
    client.on('error', () => {});
    try {
      await client.connect();
      await this.migrateUnderLock(client);
    } finally {
      await this.close(client);
    }
  }

  /**
   * Сессионная блокировка работает только на прямом соединении. За pooler Neon она
   * либо не сериализует прогоны, либо остаётся на серверном соединении после клиента.
   */
  private assertDirectConnection(): void {
    const url: URL = new URL(this.databaseUrl);
    if (!url.hostname.includes(NEON_POOLER_MARKER)) return;
    throw new Error(
      `Миграциям нужен прямой адрес базы, а в DATABASE_URL pooled-адрес (${NEON_POOLER_MARKER} в имени хоста).`,
    );
  }

  /**
   * Закрытие не должно заслонить ошибку прогона: если соединение уже мертво, `end()`
   * тоже падает, а в лог обязана попасть исходная ошибка базы. Блокировку в этом случае
   * уже отпустил обрыв соединения.
   */
  private async close(client: Client): Promise<void> {
    try {
      await client.end();
    } catch {
      // Соединение уже закрыто — закрывать нечего.
    }
  }

  private async migrateUnderLock(client: Client): Promise<void> {
    const db: NeonDatabase = drizzle({ client });
    await db.execute(sql.raw(`set lock_timeout = ${MIGRATION_LOCK_TIMEOUT_MS}`));
    await db.execute(sql`select pg_advisory_lock(${MIGRATION_LOCK_KEY})`);
    await migrate(db, { migrationsFolder: this.migrationsFolder });
    await this.assertAllApplied(db);
  }

  /**
   * Migrator drizzle применяет только миграции новее последней записи журнала и не
   * сверяет содержимое: миграция со старой меткой времени (ветка смержена позже) или
   * правка уже применённого файла пропускаются молча. Здесь прогон в таком случае
   * падает: каждая миграция из папки обязана быть в журнале с тем же хешем.
   */
  private async assertAllApplied(db: NeonDatabase): Promise<void> {
    const migrations: MigrationMeta[] = readMigrationFiles({ migrationsFolder: this.migrationsFolder });
    const journal: { rows: Record<string, unknown>[] } = await db.execute(
      sql`select hash from drizzle.__drizzle_migrations`,
    );
    const hashes: unknown[] = journal.rows.map((row) => row.hash);
    const applied: Set<unknown> = new Set(hashes);
    const missing: MigrationMeta[] = migrations.filter((migration) => !applied.has(migration.hash));
    if (missing.length === 0) return;
    const created: number[] = missing.map((migration) => migration.folderMillis);
    throw new Error(
      `Миграции из папки не совпадают с журналом базы: ${missing.length} не применено ` +
        `(when: ${created.join(', ')}). Применённый файл изменён или у новой миграции ` +
        'метка времени старше уже применённой.',
    );
  }
}
