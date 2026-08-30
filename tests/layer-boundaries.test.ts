import { ESLint, type Linter } from 'eslint';

/**
 * Границы слоёв — машинная проверка, а не пункт чек-листа
 * (docs/specs/4-architecture.md §4, §5). Тест прогоняет реальный eslint.config.js
 * по коду, которого в репозитории нет, поэтому правила проверяемы до появления
 * storage/ и state/.
 */
const UI_FILE = 'src/ui/task/boundary-fixture.tsx';

async function lintAsUiModule(code: string): Promise<Linter.LintMessage[]> {
  const eslint = new ESLint();
  const [result] = await eslint.lintText(code, { filePath: UI_FILE });
  return result?.messages ?? [];
}

function ruleIds(messages: Linter.LintMessage[]): (string | null)[] {
  return messages.map((message) => message.ruleId);
}

describe('STORAGE_IS_ISOLATED', () => {
  it('запрещает импорт storage/ из ui/ по относительному пути', async () => {
    const messages = await lintAsUiModule(
      "import { repository } from '../../storage/local-storage';\nexport const used = repository;\n",
    );

    expect(ruleIds(messages)).toContain('no-restricted-imports');
  });

  it('запрещает импорт storage/ из ui/ по алиасу', async () => {
    const messages = await lintAsUiModule(
      "import { repository } from '@/storage/local-storage';\nexport const used = repository;\n",
    );

    expect(ruleIds(messages)).toContain('no-restricted-imports');
  });

  it('запрещает обращение к localStorage из ui/', async () => {
    const messages = await lintAsUiModule(
      "export const raw = localStorage.getItem('tasks') ?? window.localStorage.length;\n",
    );

    expect(ruleIds(messages)).toEqual(
      expect.arrayContaining(['no-restricted-globals', 'no-restricted-properties']),
    );
  });
});

describe('STATE_ACCESS_VIA_HOOKS', () => {
  it('запрещает импорт внутренностей state/ из ui/', async () => {
    const messages = await lintAsUiModule(
      "import { reducer } from '@/state/reducer';\nexport const used = reducer;\n",
    );

    expect(ruleIds(messages)).toContain('no-restricted-imports');
  });

  it('разрешает импорт точки входа state/', async () => {
    const messages = await lintAsUiModule(
      "import { useInboxTasks } from '@/state';\nexport const used = useInboxTasks;\n",
    );

    expect(ruleIds(messages)).not.toContain('no-restricted-imports');
  });
});

describe('SLICE_PUBLIC_API', () => {
  it('запрещает импорт внутренностей чужого слайса', async () => {
    const messages = await lintAsUiModule(
      "import { Tabs } from '@/ui/app/tabs';\nexport const used = Tabs;\n",
    );

    expect(ruleIds(messages)).toContain('no-restricted-imports');
  });

  it('запрещает импорт из lib/ чужого слайса', async () => {
    const messages = await lintAsUiModule(
      "import { useActiveTab } from '@/ui/app/lib/use-active-tab';\nexport const used = useActiveTab;\n",
    );

    expect(ruleIds(messages)).toContain('no-restricted-imports');
  });

  it('запрещает обход index.ts относительным путём через два уровня', async () => {
    const messages = await lintAsUiModule(
      "import { App } from '../../ui/app/App';\nexport const used = App;\n",
    );

    expect(ruleIds(messages)).toContain('no-restricted-imports');
  });

  it('разрешает импорт слайса через его index.ts', async () => {
    const messages = await lintAsUiModule(
      "import { ListTab } from '@/ui/list';\nexport const used = ListTab;\n",
    );

    expect(ruleIds(messages)).not.toContain('no-restricted-imports');
  });
});
