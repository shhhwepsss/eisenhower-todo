import globals from 'globals';
import tseslint from 'typescript-eslint';
import { baseConfig, noEmptyCatch } from '../../eslint.config.base.js';
import { moduleBoundariesPlugin } from './eslint.module-boundaries.js';

const DB_BEHIND_INTERFACE =
  'DB_BEHIND_INTERFACE (docs/specs/51-db-migrations.md): Drizzle, драйвер Neon и ' +
  'адаптер Auth.js к Drizzle импортируются только в src/db/. Остальной код зависит от ' +
  'интерфейсов из types/ — реализацию базы можно заменить, не трогая приложение.';

const HTTP_STAYS_AT_EDGE =
  'HTTP_STAYS_AT_EDGE (docs/specs/60-api-modules.md): Hono импортируется только на ' +
  'HTTP-краю — в сборке приложения, src/http/ и в *.controller.ts / *.routes.ts модуля. ' +
  'Use-case, сервисы и слой базы о запросе и ответе не знают.';

const AUTH_TYPES_STAY_AT_EDGE =
  'AUTH_TYPES_STAY_AT_EDGE (docs/specs/52-google-auth.md): Auth.js импортируется только ' +
  'в src/http/, в auth.routes.ts, в слое базы (типы адаптера) и в types/auth-adapter.type.ts. ' +
  'Модули получают SessionUser, а не типы и конфиг Auth.js.';

const DB_PACKAGES = {
  group: [
    'drizzle-orm',
    'drizzle-orm/*',
    '@neondatabase/serverless',
    '@neondatabase/serverless/*',
    '@auth/drizzle-adapter',
    '@auth/drizzle-adapter/*',
  ],
  message: DB_BEHIND_INTERFACE,
};

// `@hono/auth-js` — пакет экосистемы Hono: слой базы и use-case о нём не знают.
const HTTP_PACKAGES = {
  group: ['hono', 'hono/*', '@hono/auth-js', '@hono/auth-js/*'],
  message: HTTP_STAYS_AT_EDGE,
};

const AUTH_PACKAGES = {
  group: ['@auth/core', '@auth/core/*', '@hono/auth-js', '@hono/auth-js/*'],
  message: AUTH_TYPES_STAY_AT_EDGE,
};

/**
 * `@hono/auth-js` расширяет переменные контекста Hono для всего проекта: `authConfig` (с
 * секретом) и `authUser` достаются из контекста без единого импорта, и запрет импорта
 * этого не видит. Поэтому обращение к ним по имени запрещено отдельно.
 */
const AUTH_CONTEXT_VARIABLE = /^auth(Config|User)$/;

const authContextGet = {
  selector: `CallExpression[callee.property.name=/^(get|set)$/][arguments.0.value=${AUTH_CONTEXT_VARIABLE}]`,
  message: AUTH_TYPES_STAY_AT_EDGE,
};

const authContextVar = {
  selector: `MemberExpression[object.property.name='var'][property.name=${AUTH_CONTEXT_VARIABLE}]`,
  message: AUTH_TYPES_STAY_AT_EDGE,
};

// `context.var['authConfig']` и `` context.get(`authConfig`) `` — те же обращения другой записью.
const authContextComputed = {
  selector: `MemberExpression[object.property.name='var'][property.value=${AUTH_CONTEXT_VARIABLE}]`,
  message: AUTH_TYPES_STAY_AT_EDGE,
};

const authContextTemplate = {
  selector: `CallExpression[callee.property.name=/^(get|set)$/][arguments.0.quasis.0.value.raw=${AUTH_CONTEXT_VARIABLE}]`,
  message: AUTH_TYPES_STAY_AT_EDGE,
};

// `const { authConfig } = context.var` — деструктуризация.
const authContextPattern = {
  selector: `VariableDeclarator[init.property.name='var'] > ObjectPattern > Property[key.name=${AUTH_CONTEXT_VARIABLE}]`,
  message: AUTH_TYPES_STAY_AT_EDGE,
};

const AUTH_CONTEXT_RULES = [authContextGet, authContextVar, authContextComputed, authContextTemplate, authContextPattern];

/** В типе адаптера нужен только контракт адаптера, а не весь `@auth/core`. */
const AUTH_PACKAGES_EXCEPT_ADAPTERS = {
  regex: '^@auth/core(?!/adapters$)(/|$)',
  message: AUTH_TYPES_STAY_AT_EDGE,
};

/** Где Auth.js разрешён целиком: общий HTTP-край и ручки самой библиотеки. */
const AUTH_EDGE_FILES = ['src/http/**/*.ts', 'src/modules/auth/auth.routes.ts'];

const HTTP_EDGE_FILES = [
  'src/app.ts',
  'src/create-app.ts',
  'src/http/**/*.ts',
  'src/modules/*/*.controller.ts',
  'src/modules/*/*.routes.ts',
];

/**
 * API живёт в Node (docs/specs/50-api-skeleton.md). Общие правила и границы пакетов —
 * из базы; здесь только то, чем API отличается.
 */
export default tseslint.config(
  ...baseConfig,

  {
    files: ['**/*.ts', 'scripts/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    // Сущности API — классы с методами (CLAUDE.md §8). Метод класса в ESTree — это
    // FunctionExpression, поэтому запрет из базы здесь снят. Объявления `function`
    // (`func-style`) и не-стрелочные колбэки (`prefer-arrow-callback`) по-прежнему
    // запрещены. Запрет пустого `catch` остаётся — и для скриптов на JS тоже.
    files: ['**/*.ts', 'scripts/**/*.js'],
    rules: {
      'no-restricted-syntax': ['error', noEmptyCatch],
    },
  },

  {
    // AUTH_TYPES_STAY_AT_EDGE: переменные контекста Auth.js — только в src/http/.
    files: ['src/**/*.ts', 'functions/**/*.ts'],
    ignores: ['src/http/**'],
    rules: {
      'no-restricted-syntax': ['error', noEmptyCatch, ...AUTH_CONTEXT_RULES],
    },
  },

  {
    // Базовое `no-restricted-imports`, а не `@typescript-eslint/…`: второе занято
    // границами пакетов в базе, и объект с тем же правилом стёр бы их настройки
    // (eslint.config.base.js). Это имя в apps/api теперь тоже занято: запрет импорта
    // дописывается в один из объектов ниже, а не заводится ещё одним. Объекты
    // перекрываются по файлам, и поздний заменяет настройки раннего целиком — поэтому
    // каждый перечисляет все свои запреты сам.
    //
    // Только код приложения: тесты смотрят в базу напрямую, своим соединением.
    files: ['src/**/*.ts', 'functions/**/*.ts'],
    ignores: ['src/db/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [DB_PACKAGES, HTTP_PACKAGES, AUTH_PACKAGES] }],
    },
  },

  {
    // Тип адаптера Auth.js — контракт, за которым стоит реализация в src/db/.
    files: ['src/types/auth-adapter.type.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [DB_PACKAGES, HTTP_PACKAGES, AUTH_PACKAGES_EXCEPT_ADAPTERS] }],
    },
  },

  {
    // HTTP-край (HTTP_STAYS_AT_EDGE): Hono здесь разрешён, база и Auth.js — нет.
    files: HTTP_EDGE_FILES,
    rules: {
      'no-restricted-imports': ['error', { patterns: [DB_PACKAGES, AUTH_PACKAGES] }],
    },
  },

  {
    // Край Auth.js (AUTH_TYPES_STAY_AT_EDGE): Hono и Auth.js разрешены, база — нет.
    files: AUTH_EDGE_FILES,
    rules: {
      'no-restricted-imports': ['error', { patterns: [DB_PACKAGES] }],
    },
  },

  {
    // Слой базы: Drizzle, Neon и типы адаптера `@auth/core` здесь разрешены, Hono и
    // `@hono/auth-js` — нет.
    files: ['src/db/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [HTTP_PACKAGES] }],
    },
  },

  {
    // MODULE_HAS_ONE_ENTRY (docs/specs/60-api-modules.md). Своё правило, а не ещё один
    // шаблон `no-restricted-imports`: см. eslint.module-boundaries.js.
    files: ['src/**/*.ts', 'functions/**/*.ts'],
    plugins: { 'module-boundaries': moduleBoundariesPlugin },
    rules: {
      'module-boundaries/module-has-one-entry': 'error',
    },
  },

  {
    // Схема Drizzle — декларация: тип таблицы выводится из её описания, и по нему
    // Drizzle типизирует запросы. Аннотация повторила бы описание целиком.
    files: ['src/db/schema.ts'],
    rules: {
      '@typescript-eslint/typedef': 'off',
    },
  },
);
