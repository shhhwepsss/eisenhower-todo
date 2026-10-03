/**
 * «Привести схему базы в актуальное состояние» (docs/specs/51-db-migrations.md).
 * Скрипт миграций зависит от этого контракта, а не от Drizzle и Neon.
 *
 * Сбой — исключение: прогон либо прошёл целиком, либо не изменил ничего, и вызывающему
 * остаётся только сообщить об ошибке и завершиться (FAILED_MIGRATION_FAILS_BUILD).
 */
export interface SchemaMigrator {
  migrate(): Promise<void>;
}
