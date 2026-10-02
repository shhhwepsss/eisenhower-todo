import { ESLint, type Linter } from 'eslint';

/**
 * PACKAGE_BOUNDARIES (docs/specs/48-monorepo.md): npm workspaces кладут все пакеты в
 * общий node_modules, так что запрещённый импорт соберётся. Держит его только ESLint —
 * тест прогоняет реальный конфиг приложения по коду, которого в репозитории нет.
 */
const BOUNDARY_RULE: string = '@typescript-eslint/no-restricted-imports';

const lintAs = async (filePath: string, code: string): Promise<Linter.LintMessage[]> => {
  const eslint: ESLint = new ESLint();
  const [result] = await eslint.lintText(code, { filePath });
  return result?.messages ?? [];
};

const ruleIds = (messages: Linter.LintMessage[]): (string | null)[] => {
  return messages.map((message) => message.ruleId);
};

describe('PACKAGE_BOUNDARIES', () => {
  it('запрещает относительный путь в packages/core', async () => {
    const messages: Linter.LintMessage[] = await lintAs(
      'src/state/boundary-fixture.ts',
      "import { resolveZone } from '../../../../packages/core/src/zone';\nexport const used = resolveZone;\n",
    );

    expect(ruleIds(messages)).toContain(BOUNDARY_RULE);
  });

  it('держит границу пакетов и там, где действуют правила слоёв ui/', async () => {
    const messages: Linter.LintMessage[] = await lintAs(
      'src/ui/task/boundary-fixture.tsx',
      "import { resolveZone } from '../../../../../packages/core/src/zone';\nexport const used = resolveZone;\n",
    );

    expect(ruleIds(messages)).toContain(BOUNDARY_RULE);
  });

  it('запрещает импорт другого приложения', async () => {
    const messages: Linter.LintMessage[] = await lintAs(
      'src/state/boundary-fixture.ts',
      "import { handler } from '@eisenhower/api';\nexport const used = handler;\n",
    );

    expect(ruleIds(messages)).toContain(BOUNDARY_RULE);
  });

  it('разрешает импорт ядра по имени пакета', async () => {
    const messages: Linter.LintMessage[] = await lintAs(
      'src/ui/task/boundary-fixture.tsx',
      "import { resolveZone } from '@eisenhower/core';\nexport const used = resolveZone;\n",
    );

    expect(ruleIds(messages)).not.toContain(BOUNDARY_RULE);
  });
});
