import { basename, dirname } from 'node:path';

/**
 * Раскладка файлов (docs/specs/58-file-layout.md): типы, константы, lib-модули и
 * сервисы лежат каждый в своей папке, и вид файла читается из суффикса имени.
 *
 * Локальный плагин без зависимостей: готовые плагины проверяют имя и папку, но не
 * объявления внутри файла — а без этого папки были бы, а типы жили бы где попало.
 */
const FOLDER_BY_KIND = {
  type: 'types',
  constant: 'constants',
  lib: 'lib',
  service: 'services',
};

const KIND_BY_FOLDER = Object.fromEntries(
  Object.entries(FOLDER_BY_KIND).map(([kind, folder]) => [folder, kind]),
);

const SUFFIXED_FILE = /\.(type|constant|lib|service)\.tsx?$/;

const INDEX_FILE = /^index\.tsx?$/;

const TYPE_FILE = /\.type\.tsx?$/;

const CONSTANT_FILE = /\.constant\.tsx?$/;

const UPPER_CASE = /^[A-Z][A-Z0-9_]+$/;

const SPEC = 'docs/specs/58-file-layout.md';

const fileInItsFolder = {
  meta: {
    type: 'problem',
    docs: { description: `FILE_IN_ITS_FOLDER (${SPEC})` },
    messages: {
      wrongFolder:
        'FILE_IN_ITS_FOLDER ({{spec}}): файл `{{file}}` лежит в `{{folder}}/`, а место ' +
        'ему — прямо в `{{expected}}/`.',
      missingSuffix:
        'FILE_IN_ITS_FOLDER ({{spec}}): в `{{folder}}/` лежат только `*.{{kind}}.ts` и ' +
        '`index.ts` — переименуйте `{{file}}`.',
    },
    schema: [],
  },
  create: (context) => {
    const file = basename(context.filename);
    const folder = basename(dirname(context.filename));
    return {
      Program: (node) => {
        if (INDEX_FILE.test(file)) return;
        const suffix = SUFFIXED_FILE.exec(file);
        if (suffix !== null) {
          const expected = FOLDER_BY_KIND[suffix[1]];
          if (folder !== expected) {
            context.report({
              node,
              messageId: 'wrongFolder',
              data: { spec: SPEC, file, folder, expected },
            });
          }
          return;
        }
        const kind = KIND_BY_FOLDER[folder];
        if (kind !== undefined) {
          context.report({
            node,
            messageId: 'missingSuffix',
            data: { spec: SPEC, file, folder, kind },
          });
        }
      },
    };
  },
};

const typesLiveInTypeFiles = {
  meta: {
    type: 'problem',
    docs: { description: `TYPES_LIVE_IN_TYPE_FILES (${SPEC})` },
    messages: {
      outsideTypeFile:
        'TYPES_LIVE_IN_TYPE_FILES ({{spec}}): `{{name}}` объявляется в `types/*.type.ts`, ' +
        'а сюда импортируется.',
    },
    schema: [],
  },
  create: (context) => {
    if (TYPE_FILE.test(context.filename)) return {};
    const report = (node) => {
      context.report({
        node,
        messageId: 'outsideTypeFile',
        data: { spec: SPEC, name: node.id.name },
      });
    };
    return {
      TSTypeAliasDeclaration: report,
      TSInterfaceDeclaration: report,
      TSEnumDeclaration: report,
    };
  },
};

/** Что может стоять в файле типов: импорт и экспорт типов, объявления типов. */
const isTypeOnlyStatement = (statement) => {
  switch (statement.type) {
    case 'TSTypeAliasDeclaration':
    case 'TSInterfaceDeclaration':
      return true;
    case 'ImportDeclaration':
      return statement.importKind === 'type';
    case 'ExportAllDeclaration':
      return statement.exportKind === 'type';
    case 'ExportNamedDeclaration':
      if (statement.exportKind === 'type') return true;
      return statement.declaration !== null && isTypeOnlyStatement(statement.declaration);
    default:
      return false;
  }
};

const typeFilesHoldOnlyTypes = {
  meta: {
    type: 'problem',
    docs: { description: `TYPE_FILES_HOLD_ONLY_TYPES (${SPEC})` },
    messages: {
      runtimeInTypeFile:
        'TYPE_FILES_HOLD_ONLY_TYPES ({{spec}}): в `*.type.ts` только типы — рантайм-код ' +
        'уезжает в `lib/` или `constants/`, импорт пишется как `import type`.',
    },
    schema: [],
  },
  create: (context) => {
    if (!TYPE_FILE.test(context.filename)) return {};
    return {
      Program: (program) => {
        for (const statement of program.body) {
          if (!isTypeOnlyStatement(statement)) {
            context.report({ node: statement, messageId: 'runtimeInTypeFile', data: { spec: SPEC } });
          }
        }
      },
    };
  },
};

const constantsLiveInConstantFiles = {
  meta: {
    type: 'problem',
    docs: { description: `CONSTANTS_LIVE_IN_CONSTANT_FILES (${SPEC})` },
    messages: {
      outsideConstantFile:
        'CONSTANTS_LIVE_IN_CONSTANT_FILES ({{spec}}): `{{name}}` объявляется в ' +
        '`constants/*.constant.ts`, а сюда импортируется.',
    },
    schema: [],
  },
  create: (context) => {
    if (CONSTANT_FILE.test(context.filename)) return {};
    const checkDeclaration = (declaration) => {
      if (declaration.kind !== 'const') return;
      for (const declarator of declaration.declarations) {
        const id = declarator.id;
        if (id.type === 'Identifier' && UPPER_CASE.test(id.name)) {
          context.report({
            node: declarator,
            messageId: 'outsideConstantFile',
            data: { spec: SPEC, name: id.name },
          });
        }
      }
    };
    return {
      'Program > VariableDeclaration': checkDeclaration,
      'Program > ExportNamedDeclaration > VariableDeclaration': checkDeclaration,
    };
  },
};

export const fileLayoutPlugin = {
  meta: { name: 'file-layout' },
  rules: {
    'file-in-its-folder': fileInItsFolder,
    'types-live-in-type-files': typesLiveInTypeFiles,
    'type-files-hold-only-types': typeFilesHoldOnlyTypes,
    'constants-live-in-constant-files': constantsLiveInConstantFiles,
  },
};
