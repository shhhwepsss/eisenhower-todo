import { ESLint, type Linter } from 'eslint';

/**
 * DB_BEHIND_INTERFACE (docs/specs/51-db-migrations.md). Тест прогоняет реальный конфиг
 * API по коду, которого в репозитории нет, под разными путями: правило должно
 * срабатывать, а не только быть написано.
 */
const lintAs = async (filePath: string, code: string): Promise<Linter.LintMessage[]> => {
  const eslint: ESLint = new ESLint();
  const [result] = await eslint.lintText(code, { filePath });
  const messages: Linter.LintMessage[] = result?.messages ?? [];
  const fatal: Linter.LintMessage[] = messages.filter((message) => message.fatal === true);
  // Код, который не разобрался, не нарушает ни одного правила — «разрешено» было бы ложным.
  expect(fatal).toEqual([]);
  return messages;
};

const ruleIds = (messages: Linter.LintMessage[]): (string | null)[] => {
  return messages.map((message) => message.ruleId);
};

const DB_BEHIND_INTERFACE: string = 'no-restricted-imports';

const DRIZZLE_CODE: string = "import { sql } from 'drizzle-orm';\nexport const query = sql;\n";

const DRIZZLE_DRIVER_CODE: string =
  "import { drizzle } from 'drizzle-orm/neon-http';\nexport const connect = drizzle;\n";

const DRIZZLE_MIGRATOR_CODE: string =
  "import { migrate } from 'drizzle-orm/neon-serverless/migrator';\nexport const run = migrate;\n";

const NEON_CODE: string =
  "import { neon } from '@neondatabase/serverless';\nexport const connect = neon;\n";

describe('DB_BEHIND_INTERFACE', () => {
  it('запрещает drizzle-orm в src/ вне src/db/', async () => {
    const messages: Linter.LintMessage[] = await lintAs('src/create-app.ts', DRIZZLE_CODE);

    expect(ruleIds(messages)).toContain(DB_BEHIND_INTERFACE);
  });

  it('запрещает подпуть drizzle-orm', async () => {
    const messages: Linter.LintMessage[] = await lintAs(
      'src/services/fixture.service.ts',
      DRIZZLE_DRIVER_CODE,
    );

    expect(ruleIds(messages)).toContain(DB_BEHIND_INTERFACE);
  });

  it('запрещает вложенный подпуть drizzle-orm', async () => {
    const messages: Linter.LintMessage[] = await lintAs('src/migrate.ts', DRIZZLE_MIGRATOR_CODE);

    expect(ruleIds(messages)).toContain(DB_BEHIND_INTERFACE);
  });

  it('запрещает драйвер Neon в functions/', async () => {
    const messages: Linter.LintMessage[] = await lintAs('functions/fixture.ts', NEON_CODE);

    expect(ruleIds(messages)).toContain(DB_BEHIND_INTERFACE);
  });

  it('разрешает оба пакета в src/db/', async () => {
    const drizzleMessages: Linter.LintMessage[] = await lintAs('src/db/fixture.ts', DRIZZLE_CODE);
    const neonMessages: Linter.LintMessage[] = await lintAs('src/db/fixture.ts', NEON_CODE);

    expect(ruleIds(drizzleMessages)).not.toContain(DB_BEHIND_INTERFACE);
    expect(ruleIds(neonMessages)).not.toContain(DB_BEHIND_INTERFACE);
  });
});
