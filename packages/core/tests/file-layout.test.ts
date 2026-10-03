import { ESLint, type Linter } from 'eslint';

/**
 * Раскладка файлов (docs/specs/58-file-layout.md). Тест прогоняет реальный конфиг
 * ядра по коду, которого в репозитории нет, под разными путями: правила должны
 * срабатывать, а не только быть написаны.
 */
const lintAs = async (filePath: string, code: string): Promise<Linter.LintMessage[]> => {
  const eslint: ESLint = new ESLint();
  const [result] = await eslint.lintText(code, { filePath });
  return result?.messages ?? [];
};

const ruleIds = (messages: Linter.LintMessage[]): (string | null)[] => {
  return messages.map((message) => message.ruleId);
};

const FILE_IN_ITS_FOLDER: string = 'file-layout/file-in-its-folder';
const TYPES_LIVE_IN_TYPE_FILES: string = 'file-layout/types-live-in-type-files';
const TYPE_FILES_HOLD_ONLY_TYPES: string = 'file-layout/type-files-hold-only-types';
const CONSTANTS_LIVE_IN_CONSTANT_FILES: string = 'file-layout/constants-live-in-constant-files';

const TYPE_CODE: string = "export type Fixture = 'a' | 'b';\n";

const MAPPER_CODE: string = 'export const toFixture = (value: number): string => `${value}`;\n';

describe('FILE_IN_ITS_FOLDER', () => {
  it('запрещает файл без суффикса в types/', async () => {
    const messages: Linter.LintMessage[] = await lintAs('src/types/fixture.ts', TYPE_CODE);

    expect(ruleIds(messages)).toContain(FILE_IN_ITS_FOLDER);
  });

  it('запрещает *.type.ts вне types/', async () => {
    const messages: Linter.LintMessage[] = await lintAs('src/lib/fixture.type.ts', TYPE_CODE);

    expect(ruleIds(messages)).toContain(FILE_IN_ITS_FOLDER);
  });

  it('запрещает вложенную папку внутри types/', async () => {
    const messages: Linter.LintMessage[] = await lintAs('src/types/nested/fixture.type.ts', TYPE_CODE);

    expect(ruleIds(messages)).toContain(FILE_IN_ITS_FOLDER);
  });

  it('запрещает файл без суффикса в lib/ и services/', async () => {
    const libMessages: Linter.LintMessage[] = await lintAs('src/lib/fixture.ts', 'export const fixture = 1;\n');
    const serviceMessages: Linter.LintMessage[] = await lintAs(
      'src/services/fixture.ts',
      'export const fixture = 1;\n',
    );

    expect(ruleIds(libMessages)).toContain(FILE_IN_ITS_FOLDER);
    expect(ruleIds(serviceMessages)).toContain(FILE_IN_ITS_FOLDER);
  });

  it('разрешает *.type.ts в types/ и index.ts без суффикса', async () => {
    const typeMessages: Linter.LintMessage[] = await lintAs('src/types/fixture.type.ts', TYPE_CODE);
    const indexMessages: Linter.LintMessage[] = await lintAs(
      'src/types/index.ts',
      "export type { Task } from './task.type';\n",
    );

    expect(ruleIds(typeMessages)).not.toContain(FILE_IN_ITS_FOLDER);
    expect(ruleIds(indexMessages)).not.toContain(FILE_IN_ITS_FOLDER);
  });

  it('запрещает *.mapper.ts вне mappers/', async () => {
    const besideMessages: Linter.LintMessage[] = await lintAs(
      'src/modules/health/fixture.mapper.ts',
      MAPPER_CODE,
    );
    const libMessages: Linter.LintMessage[] = await lintAs('src/lib/fixture.mapper.ts', MAPPER_CODE);

    expect(ruleIds(besideMessages)).toContain(FILE_IN_ITS_FOLDER);
    expect(ruleIds(libMessages)).toContain(FILE_IN_ITS_FOLDER);
  });

  it('запрещает файл без суффикса и вложенную папку в mappers/', async () => {
    const bareMessages: Linter.LintMessage[] = await lintAs('src/mappers/fixture.ts', MAPPER_CODE);
    const nestedMessages: Linter.LintMessage[] = await lintAs(
      'src/mappers/nested/fixture.mapper.ts',
      MAPPER_CODE,
    );

    expect(ruleIds(bareMessages)).toContain(FILE_IN_ITS_FOLDER);
    expect(ruleIds(nestedMessages)).toContain(FILE_IN_ITS_FOLDER);
  });

  it('разрешает *.mapper.ts в mappers/ — в корне src и в папке модуля — и index.ts', async () => {
    const rootMessages: Linter.LintMessage[] = await lintAs('src/mappers/fixture.mapper.ts', MAPPER_CODE);
    const moduleMessages: Linter.LintMessage[] = await lintAs(
      'src/modules/health/mappers/fixture.mapper.ts',
      MAPPER_CODE,
    );
    const indexMessages: Linter.LintMessage[] = await lintAs(
      'src/mappers/index.ts',
      "export { toFixture } from './fixture.mapper';\n",
    );

    expect(ruleIds(rootMessages)).not.toContain(FILE_IN_ITS_FOLDER);
    expect(ruleIds(moduleMessages)).not.toContain(FILE_IN_ITS_FOLDER);
    expect(ruleIds(indexMessages)).not.toContain(FILE_IN_ITS_FOLDER);
  });
});

describe('TYPES_LIVE_IN_TYPE_FILES', () => {
  it('запрещает type, interface и enum вне *.type.ts', async () => {
    const messages: Linter.LintMessage[] = await lintAs(
      'src/fixture.ts',
      'export type A = 1;\nexport interface B { b: 1 }\nexport enum C { D }\n',
    );

    const restricted: Linter.LintMessage[] = messages.filter(
      (message) => message.ruleId === TYPES_LIVE_IN_TYPE_FILES,
    );
    expect(restricted).toHaveLength(3);
  });

  it('не проверяет tests/', async () => {
    const messages: Linter.LintMessage[] = await lintAs('tests/fixture.test.ts', TYPE_CODE);

    expect(ruleIds(messages)).not.toContain(TYPES_LIVE_IN_TYPE_FILES);
  });
});

describe('TYPE_FILES_HOLD_ONLY_TYPES', () => {
  it('запрещает рантайм-код в *.type.ts', async () => {
    const messages: Linter.LintMessage[] = await lintAs(
      'src/types/fixture.type.ts',
      `${TYPE_CODE}export const runtime = 1;\n`,
    );

    expect(ruleIds(messages)).toContain(TYPE_FILES_HOLD_ONLY_TYPES);
  });

  it('разрешает импорт и реэкспорт типов', async () => {
    const messages: Linter.LintMessage[] = await lintAs(
      'src/types/fixture.type.ts',
      "import type { Task } from './task.type';\nexport type Fixture = Task;\nexport type { Zone } from './zone.type';\n",
    );

    expect(ruleIds(messages)).not.toContain(TYPE_FILES_HOLD_ONLY_TYPES);
  });
});

describe('CONSTANTS_LIVE_IN_CONSTANT_FILES', () => {
  it('запрещает константу UPPER_CASE верхнего уровня вне *.constant.ts', async () => {
    const messages: Linter.LintMessage[] = await lintAs(
      'src/fixture.ts',
      'const LIMIT: number = 3;\nexport const MAX_RANK: number = LIMIT;\n',
    );

    const restricted: Linter.LintMessage[] = messages.filter(
      (message) => message.ruleId === CONSTANTS_LIVE_IN_CONSTANT_FILES,
    );
    expect(restricted).toHaveLength(2);
  });

  it('разрешает ту же константу внутри функции и в *.constant.ts', async () => {
    const localMessages: Linter.LintMessage[] = await lintAs(
      'src/fixture.ts',
      'export const limit = (): number => {\n  const LIMIT: number = 3;\n  return LIMIT;\n};\n',
    );
    const constantMessages: Linter.LintMessage[] = await lintAs(
      'src/constants/fixture.constant.ts',
      'export const LIMIT: number = 3;\n',
    );

    expect(ruleIds(localMessages)).not.toContain(CONSTANTS_LIVE_IN_CONSTANT_FILES);
    expect(ruleIds(constantMessages)).not.toContain(CONSTANTS_LIVE_IN_CONSTANT_FILES);
  });
});
