# eisenhower-todo

Матрица Эйзенхауэра и список задач в одном локальном приложении.

- Требования: [`docs/PRD.md`](docs/PRD.md)
- Архитектура и разбиение на фазы: [`docs/specs/4-architecture.md`](docs/specs/4-architecture.md)
- Правила работы над проектом: [`CLAUDE.md`](CLAUDE.md)

## Стек

Vite + React + TypeScript (`strict`), Vitest, ESLint.

## Команды

Команды запускаются из корня и проходят по всем пакетам (npm workspaces).

```bash
npm install
npm run dev      # дев-сервер apps/web; /api проксируется на dev-сервер API
npm run dev:api  # дев-сервер apps/api на 127.0.0.1:8787 (во втором терминале)
npm run build    # проверка типов + продовая сборка
npm run test     # тесты (vitest) каждого пакета
npm run lint     # eslint, включая границы слоёв и пакетов
```

## Пакеты

```
packages/core/   @eisenhower/core — домен; общий код для фронта и бека
apps/web/        фронтенд: state, storage, ui, shared, styles
apps/api/        бек: Hono за одной функцией Netlify (/api/*)
```

Фронт и API — один сайт Netlify. Функция собирается `vite build` в
`apps/api/dist/functions/api.mjs` вместе с `@eisenhower/core`: бандлер функций Netlify
пакеты не собирает, а core — исходники на TypeScript
([`docs/specs/50-api-skeleton.md`](docs/specs/50-api-skeleton.md)).

Общий код приложение берёт только через `@eisenhower/core`. Пакет ядра не знает о
браузере и React. Эти правила держит ESLint (`PACKAGE_BOUNDARIES`, `CORE_IS_PORTABLE`,
[`docs/specs/48-monorepo.md`](docs/specs/48-monorepo.md)): общая часть конфига лежит в
`eslint.config.base.js`, у каждого пакета есть свой `eslint.config.js`.

## Границы слоёв

Направление зависимостей `ui/ → state/ → @eisenhower/core`, хранилище за портом
(`docs/specs/4-architecture.md` §4, §5). Границы держит `apps/web/eslint.config.js`,
а не договорённость:

- `STORAGE_IS_ISOLATED` — `ui/` не импортирует `storage/` и не трогает `localStorage`;
- `STATE_ACCESS_VIA_HOOKS` — `ui/` импортирует из `state/` только точку входа с хуками.

- `SLICE_PUBLIC_API` — чужой слайс импортируется только через его `index.ts`
  по алиасу `@/` (например `@/ui/list`), внутренности приватны.

Что все три правила действительно срабатывают, проверяет
[`apps/web/tests/layer-boundaries.test.ts`](apps/web/tests/layer-boundaries.test.ts).

## Раскладка кода

```
apps/web/src/ui/app/
  index.ts          публичный контракт слайса
  App.tsx           единственный компонент в корне
  App.module.scss   стили компонента
  children/         только разметка, один уровень вложенности, без логики
  hooks/            состояние и эффекты слайса
  lib/              *.lib.ts — чистые функции слайса
  constants/        *.constant.ts — константы слайса
  types/            *.type.ts — по файлу на тип + index.ts

packages/core/src/
  index.ts          публичный контракт слоя
  types/            *.type.ts — по файлу на тип + index.ts
  constants/        *.constant.ts — QUADRANT_FLAGS и ZONE_MOVES (таблица всех 25 переходов)
  zone.ts           resolveZone / resolvePriority — в какой зоне лежит задача
  list-group.ts     getTasksListGroup — в какой группе списка
  visibility.ts     isTaskLive / isTaskInMatrix — надгробия и done
  ordering.ts       ранги: генерация, сравнение, сортировка квадранта
  factory.ts        createTask — единственная дверь в Task
  mutations.ts      чистые мутации задачи; updatedAt пишется только в touch
  text.ts           нормализация заголовка и описания

apps/web/src/storage/
  index.ts          публичный контракт слоя: createRepositories, ошибки, типы
  types/            *.type.ts — порты TaskRepository / SettingsRepository, KeyValueStorage
  constants/        *.constant.ts — SCHEMA_VERSION и ключи хранилища
  envelope.ts       конверт { version, ...данные }: вскрыть и запечатать
  guards.ts         проверки формы для данных, пришедших из хранилища
  log.ts            логгер слоя: одна область на всё хранилище
  decode.ts         содержимое конверта → Task[] и UiSettings
  local-storage.ts  адаптер снапшотов поверх KeyValueStorage
  memory.ts         запасное хранилище на время жизни вкладки
  create.ts         вход в слой: единственное место, где берётся localStorage

apps/web/src/shared/
  logger.ts         Log.debug / info / warn / error, соглашения — CLAUDE.md §9
  errors.ts         describeError — ошибка в нагрузку лога отдельными ключами

apps/web/src/styles/         global.scss (:root, body), _tokens.scss (сырые значения)
apps/web/src/shared/styles/  общие миксины оформления

apps/web/tests/      зеркало apps/web/src/ + setup.ts и тесты границ
packages/core/tests/ тесты ядра, окружение node
```

Компоненту в `children/` нельзя иметь собственную логику: нужна логика — она
переезжает в `hooks/` или `lib/`. Стили — SCSS-модули рядом с компонентом,
соглашения по стилям и мемоизации — в [`CLAUDE.md`](CLAUDE.md) §7.
