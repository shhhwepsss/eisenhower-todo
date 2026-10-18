import { ESLint, type Linter } from 'eslint';

/**
 * AUTH_TYPES_STAY_AT_EDGE (docs/specs/52-google-auth.md): Auth.js — только на своём краю.
 * Тест прогоняет реальный конфиг API по коду, которого в репозитории нет, под разными
 * путями: правило должно срабатывать, а не только быть написано.
 */
const lintAs = async (filePath: string, code: string): Promise<Linter.LintMessage[]> => {
  const eslint: ESLint = new ESLint();
  const [result] = await eslint.lintText(code, { filePath });
  const messages: Linter.LintMessage[] = result?.messages ?? [];
  const fatal: Linter.LintMessage[] = messages.filter((message: Linter.LintMessage) => message.fatal === true);
  // Код, который не разобрался, не нарушает ни одного правила — «разрешено» было бы ложным.
  expect(fatal).toEqual([]);
  return messages;
};

const ruleIds = (messages: Linter.LintMessage[]): (string | null)[] => {
  return messages.map((message: Linter.LintMessage) => message.ruleId);
};

const RESTRICTED_IMPORTS: string = 'no-restricted-imports';

const RESTRICTED_SYNTAX: string = 'no-restricted-syntax';

const HONO_AUTH_CODE: string = "import { getAuthUser } from '@hono/auth-js';\nexport const read = getAuthUser;\n";

const AUTH_CORE_CODE: string = "import { encode } from '@auth/core/jwt';\nexport const sign = encode;\n";

const AUTH_CONFIG_GET_CODE: string =
  "import type { Context } from 'hono';\nexport const secretOf = (context: Context): unknown => context.get('authConfig');\n";

const AUTH_USER_VAR_CODE: string =
  "import type { Context } from 'hono';\nexport const userOf = (context: Context): unknown => context.var.authUser;\n";

const AUTH_CONFIG_COMPUTED_CODE: string =
  "import type { Context } from 'hono';\nexport const secretOf = (context: Context): unknown => context.var['authConfig'];\n";

const AUTH_CONFIG_TEMPLATE_CODE: string =
  "import type { Context } from 'hono';\nexport const secretOf = (context: Context): unknown => context.get(`authConfig`);\n";

const AUTH_CONFIG_PATTERN_CODE: string =
  "import type { Context } from 'hono';\nexport const secretOf = (context: Context): unknown => {\n  const { authConfig } = context.var;\n  return authConfig;\n};\n";

describe('AUTH_TYPES_STAY_AT_EDGE: импорт @hono/auth-js', () => {
  it.each([
    'src/modules/me/me.controller.ts',
    'src/modules/health/check-health.use-case.ts',
    'src/db/neon/fixture.ts',
    'src/lib/fixture.lib.ts',
    'src/create-app.ts',
  ])('запрещён в %s', async (filePath: string) => {
    const messages: Linter.LintMessage[] = await lintAs(filePath, HONO_AUTH_CODE);

    expect(ruleIds(messages)).toContain(RESTRICTED_IMPORTS);
  });

  it.each(['src/http/fixture.middleware.ts', 'src/modules/auth/auth.routes.ts'])(
    'разрешён в %s',
    async (filePath: string) => {
      const messages: Linter.LintMessage[] = await lintAs(filePath, HONO_AUTH_CODE);

      expect(ruleIds(messages)).not.toContain(RESTRICTED_IMPORTS);
    },
  );
});

describe('AUTH_TYPES_STAY_AT_EDGE: импорт @auth/core', () => {
  it.each([
    'src/modules/me/me.controller.ts',
    'src/modules/health/check-health.use-case.ts',
    'src/types/fixture.type.ts',
    'src/lib/fixture.lib.ts',
  ])('запрещён в %s', async (filePath: string) => {
    const messages: Linter.LintMessage[] = await lintAs(filePath, AUTH_CORE_CODE);

    expect(ruleIds(messages)).toContain(RESTRICTED_IMPORTS);
  });

  it('в типе адаптера разрешён только @auth/core/adapters', async () => {
    const adapters: Linter.LintMessage[] = await lintAs(
      'src/types/auth-adapter.type.ts',
      "import type { Adapter } from '@auth/core/adapters';\nexport type Fixture = Adapter;\n",
    );
    const jwt: Linter.LintMessage[] = await lintAs('src/types/auth-adapter.type.ts', AUTH_CORE_CODE);

    expect(ruleIds(adapters)).not.toContain(RESTRICTED_IMPORTS);
    expect(ruleIds(jwt)).toContain(RESTRICTED_IMPORTS);
  });

  it.each(['src/http/fixture.middleware.ts', 'src/db/neon/fixture.ts'])(
    'разрешён в %s',
    async (filePath: string) => {
      const messages: Linter.LintMessage[] = await lintAs(filePath, AUTH_CORE_CODE);

      expect(ruleIds(messages)).not.toContain(RESTRICTED_IMPORTS);
    },
  );
});

describe('AUTH_TYPES_STAY_AT_EDGE: переменные контекста Auth.js', () => {
  it.each([
    AUTH_CONFIG_GET_CODE,
    AUTH_USER_VAR_CODE,
    AUTH_CONFIG_COMPUTED_CODE,
    AUTH_CONFIG_TEMPLATE_CODE,
    AUTH_CONFIG_PATTERN_CODE,
  ])('запрещены в контроллере модуля: %s', async (code: string) => {
    const messages: Linter.LintMessage[] = await lintAs('src/modules/me/me.controller.ts', code);

    expect(ruleIds(messages)).toContain(RESTRICTED_SYNTAX);
  });

  it('разрешены в src/http/', async () => {
    const messages: Linter.LintMessage[] = await lintAs('src/http/fixture.middleware.ts', AUTH_CONFIG_GET_CODE);

    expect(ruleIds(messages)).not.toContain(RESTRICTED_SYNTAX);
  });
});
