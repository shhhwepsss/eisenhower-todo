import { ESLint, type Linter } from 'eslint';

/**
 * Ядро — общий код для фронта и бека. Тест прогоняет реальный конфиг ядра по коду,
 * которого в репозитории нет: PACKAGE_BOUNDARIES и CORE_IS_PORTABLE
 * (docs/specs/48-monorepo.md) должны срабатывать, а не только быть написаны.
 */
const CORE_FILE: string = 'src/boundary-fixture.ts';
const BOUNDARY_RULE: string = '@typescript-eslint/no-restricted-imports';

const lintAsCoreModule = async (code: string): Promise<Linter.LintMessage[]> => {
  const eslint: ESLint = new ESLint();
  const [result] = await eslint.lintText(code, { filePath: CORE_FILE });
  return result?.messages ?? [];
};

const ruleIds = (messages: Linter.LintMessage[]): (string | null)[] => {
  return messages.map((message) => message.ruleId);
};

describe('PACKAGE_BOUNDARIES', () => {
  it('запрещает импорт приложения по имени пакета', async () => {
    const messages: Linter.LintMessage[] = await lintAsCoreModule(
      "import { App } from '@eisenhower/web';\nexport const used = App;\n",
    );

    expect(ruleIds(messages)).toContain(BOUNDARY_RULE);
  });

  it('запрещает импорт приложения относительным путём', async () => {
    const messages: Linter.LintMessage[] = await lintAsCoreModule(
      "import { reducer } from '../../../apps/web/src/state/reducer';\nexport const used = reducer;\n",
    );

    expect(ruleIds(messages)).toContain(BOUNDARY_RULE);
  });
});

describe('CORE_IS_PORTABLE', () => {
  it('запрещает импорт React', async () => {
    const messages: Linter.LintMessage[] = await lintAsCoreModule(
      "import { useState } from 'react';\nexport const used = useState;\n",
    );

    expect(ruleIds(messages)).toContain('no-restricted-imports');
  });

  it('запрещает обращение к браузерным глобалам', async () => {
    const messages: Linter.LintMessage[] = await lintAsCoreModule(
      "export const raw = localStorage.getItem('tasks') ?? window.name ?? document.title;\n",
    );

    const restricted: Linter.LintMessage[] = messages.filter(
      (message) => message.ruleId === 'no-restricted-globals',
    );
    expect(restricted).toHaveLength(3);
  });

  it('разрешает импорт внутри ядра', async () => {
    const messages: Linter.LintMessage[] = await lintAsCoreModule(
      "import { resolveZone } from './zone';\nexport const used = resolveZone;\n",
    );

    expect(ruleIds(messages)).not.toContain(BOUNDARY_RULE);
    expect(ruleIds(messages)).not.toContain('no-restricted-imports');
  });
});
