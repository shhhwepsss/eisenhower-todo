import { ESLint, type Linter } from 'eslint';

/**
 * Границы слоёв и модулей API (docs/specs/60-api-modules.md). Тест прогоняет реальный
 * конфиг API по коду, которого в репозитории нет, под разными путями: правило должно
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

const RESTRICTED_IMPORTS: string = 'no-restricted-imports';

const MODULE_HAS_ONE_ENTRY: string = 'module-boundaries/module-has-one-entry';

const HONO_CODE: string = "import { Hono } from 'hono';\nexport const create = (): Hono => new Hono();\n";

const HONO_TYPE_CODE: string =
  "import type { Context } from 'hono';\nexport const pathOf = (c: Context): string => c.req.path;\n";

const HONO_SUBPATH_CODE: string =
  "import { getCookie } from 'hono/cookie';\nexport const read = getCookie;\n";

const DRIZZLE_CODE: string = "import { sql } from 'drizzle-orm';\nexport const query = sql;\n";

/** Импорт `specifier` и использование импортированного — иначе сработал бы `no-unused-vars`. */
const importOf = (specifier: string): string => {
  return `import { fixture } from '${specifier}';\nexport const used = fixture;\n`;
};

describe('HTTP_STAYS_AT_EDGE', () => {
  it('запрещает Hono в use-case', async () => {
    const messages: Linter.LintMessage[] = await lintAs(
      'src/modules/health/check-health.use-case.ts',
      HONO_TYPE_CODE,
    );

    expect(ruleIds(messages)).toContain(RESTRICTED_IMPORTS);
  });

  it('запрещает Hono в сервисе модуля', async () => {
    const messages: Linter.LintMessage[] = await lintAs(
      'src/modules/health/services/fixture.service.ts',
      HONO_CODE,
    );

    expect(ruleIds(messages)).toContain(RESTRICTED_IMPORTS);
  });

  it('запрещает Hono в сборке модуля', async () => {
    const messages: Linter.LintMessage[] = await lintAs(
      'src/modules/health/health.composition.ts',
      HONO_TYPE_CODE,
    );

    expect(ruleIds(messages)).toContain(RESTRICTED_IMPORTS);
  });

  it('запрещает подпуть Hono в lib', async () => {
    const messages: Linter.LintMessage[] = await lintAs('src/lib/fixture.lib.ts', HONO_SUBPATH_CODE);

    expect(ruleIds(messages)).toContain(RESTRICTED_IMPORTS);
  });

  it('запрещает Hono в слое базы', async () => {
    const messages: Linter.LintMessage[] = await lintAs('src/db/neon/fixture.ts', HONO_CODE);

    expect(ruleIds(messages)).toContain(RESTRICTED_IMPORTS);
  });

  it('разрешает Hono в контроллере, маршрутах, src/http/ и сборке приложения', async () => {
    const controller: Linter.LintMessage[] = await lintAs(
      'src/modules/health/health.controller.ts',
      HONO_TYPE_CODE,
    );
    const routes: Linter.LintMessage[] = await lintAs('src/modules/health/health.routes.ts', HONO_CODE);
    const http: Linter.LintMessage[] = await lintAs('src/http/fixture.middleware.ts', HONO_TYPE_CODE);
    const assembly: Linter.LintMessage[] = await lintAs('src/create-app.ts', HONO_CODE);

    expect(ruleIds(controller)).not.toContain(RESTRICTED_IMPORTS);
    expect(ruleIds(routes)).not.toContain(RESTRICTED_IMPORTS);
    expect(ruleIds(http)).not.toContain(RESTRICTED_IMPORTS);
    expect(ruleIds(assembly)).not.toContain(RESTRICTED_IMPORTS);
  });

  it('DB_BEHIND_INTERFACE на HTTP-краю не снят: Drizzle в контроллере запрещён', async () => {
    const controller: Linter.LintMessage[] = await lintAs(
      'src/modules/health/health.controller.ts',
      DRIZZLE_CODE,
    );
    const assembly: Linter.LintMessage[] = await lintAs('src/create-app.ts', DRIZZLE_CODE);

    expect(ruleIds(controller)).toContain(RESTRICTED_IMPORTS);
    expect(ruleIds(assembly)).toContain(RESTRICTED_IMPORTS);
  });
});

describe('MODULE_HAS_ONE_ENTRY', () => {
  it('снаружи запрещает импорт контроллера модуля', async () => {
    const code: string = importOf('./modules/health/health.controller');
    const messages: Linter.LintMessage[] = await lintAs('src/create-app.ts', code);

    expect(ruleIds(messages)).toContain(MODULE_HAS_ONE_ENTRY);
  });

  it('снаружи запрещает импорт сервиса и типов модуля', async () => {
    const service: string = importOf('../modules/health/services/database-health.service');
    const types: string = importOf('../modules/health/types');
    const serviceMessages: Linter.LintMessage[] = await lintAs('src/http/fixture.middleware.ts', service);
    const typesMessages: Linter.LintMessage[] = await lintAs('src/http/fixture.middleware.ts', types);

    expect(ruleIds(serviceMessages)).toContain(MODULE_HAS_ONE_ENTRY);
    expect(ruleIds(typesMessages)).toContain(MODULE_HAS_ONE_ENTRY);
  });

  it('снаружи запрещает реэкспорт внутренностей модуля', async () => {
    const code: string = "export { fixture } from './modules/health/check-health.use-case';\n";
    const messages: Linter.LintMessage[] = await lintAs('src/create-app.ts', code);

    expect(ruleIds(messages)).toContain(MODULE_HAS_ONE_ENTRY);
  });

  it('запрещает импорт одного модуля из другого — и внутренностей, и входа', async () => {
    const internals: string = importOf('../health/services/database-health.service');
    const fromNested: string = importOf('../../health/check-health.use-case');
    const entry: string = importOf('../health/health.routes');
    const internalsMessages: Linter.LintMessage[] = await lintAs('src/modules/tasks/tasks.routes.ts', internals);
    const nestedMessages: Linter.LintMessage[] = await lintAs(
      'src/modules/tasks/services/fixture.service.ts',
      fromNested,
    );
    const entryMessages: Linter.LintMessage[] = await lintAs('src/modules/tasks/tasks.routes.ts', entry);

    expect(ruleIds(internalsMessages)).toContain(MODULE_HAS_ONE_ENTRY);
    expect(ruleIds(nestedMessages)).toContain(MODULE_HAS_ONE_ENTRY);
    expect(ruleIds(entryMessages)).toContain(MODULE_HAS_ONE_ENTRY);
  });

  it('снаружи разрешает вход модуля — *.routes', async () => {
    const code: string = importOf('./modules/health/health.routes');
    const messages: Linter.LintMessage[] = await lintAs('src/create-app.ts', code);

    expect(ruleIds(messages)).not.toContain(MODULE_HAS_ONE_ENTRY);
  });

  it('внутри модуля разрешает свои файлы и общий код вне modules/', async () => {
    const sibling: string = importOf('./health.controller');
    const ownFromNested: string = importOf('../types');
    const shared: string = importOf('../../../types');
    const siblingMessages: Linter.LintMessage[] = await lintAs('src/modules/health/health.routes.ts', sibling);
    const ownMessages: Linter.LintMessage[] = await lintAs(
      'src/modules/health/services/fixture.service.ts',
      ownFromNested,
    );
    const sharedMessages: Linter.LintMessage[] = await lintAs(
      'src/modules/health/services/fixture.service.ts',
      shared,
    );

    expect(ruleIds(siblingMessages)).not.toContain(MODULE_HAS_ONE_ENTRY);
    expect(ruleIds(ownMessages)).not.toContain(MODULE_HAS_ONE_ENTRY);
    expect(ruleIds(sharedMessages)).not.toContain(MODULE_HAS_ONE_ENTRY);
  });
});
