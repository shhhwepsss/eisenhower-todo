import { dirname, resolve } from 'node:path';

/**
 * Границы модулей API (docs/specs/60-api-modules.md). Локальный плагин без зависимостей,
 * как `eslint.file-layout.js` в корне: `no-restricted-imports` видит только текст импорта,
 * а `../tasks/tasks.service` из соседнего модуля и `../types` из своего по тексту не
 * отличить — нужен путь, разрешённый относительно импортирующего файла.
 */
const SPEC = 'docs/specs/60-api-modules.md';

/** Файл внутри `src/modules/<имя>/`: первая группа — имя модуля, вторая — путь внутри. */
const MODULE_FILE = /[\\/]src[\\/]modules[\\/]([^\\/]+)[\\/](.+)$/;

/** Вход модуля: `<что-то>.routes` прямо в его папке, с расширением или без. */
const ENTRY_FILE = /^[^\\/]+\.routes(\.ts)?$/;

const moduleHasOneEntry = {
  meta: {
    type: 'problem',
    docs: { description: `MODULE_HAS_ONE_ENTRY (${SPEC})` },
    messages: {
      notEntry:
        'MODULE_HAS_ONE_ENTRY ({{spec}}): снаружи из модуля `{{module}}` импортируется ' +
        'только его `*.routes.ts` — остальное внутренности модуля.',
      otherModule:
        'MODULE_HAS_ONE_ENTRY ({{spec}}): модуль `{{importer}}` не импортирует модуль ' +
        '`{{module}}`. Общее для двух модулей выносится из `modules/`.',
    },
    schema: [],
  },
  create: (context) => {
    const importerFolder = dirname(context.filename);
    const importer = MODULE_FILE.exec(context.filename);
    const check = (node) => {
      // `export { x }` без `from` — не импорт.
      if (node.source === null || node.source === undefined) return;
      const specifier = node.source.value;
      // Пакеты границу модулей не пересекают; чужие пакеты держит PACKAGE_BOUNDARIES.
      if (typeof specifier !== 'string' || !specifier.startsWith('.')) return;
      const target = resolve(importerFolder, specifier);
      const owner = MODULE_FILE.exec(target);
      if (owner === null) return;
      const [, module, inner] = owner;
      if (importer === null) {
        if (ENTRY_FILE.test(inner)) return;
        context.report({ node, messageId: 'notEntry', data: { spec: SPEC, module } });
        return;
      }
      if (importer[1] === module) return;
      context.report({
        node,
        messageId: 'otherModule',
        data: { spec: SPEC, importer: importer[1], module },
      });
    };
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
};

export const moduleBoundariesPlugin = {
  meta: { name: 'module-boundaries' },
  rules: {
    'module-has-one-entry': moduleHasOneEntry,
  },
};
