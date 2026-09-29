# #48 — Монорепозиторий: apps/web + packages/core

## Задача

Переложить репозиторий в монорепозиторий `apps/web` + `packages/core` с машинно
проверяемыми границами между пакетами, не меняя поведения приложения.

## Прототип

Не требуется.

## Решения

Приняты человеком 2026-09-23 — 2026-09-28, раскладка согласована после разбора у
`system-architect`; уточнения при старте — 2026-09-29.

- **Зачем монорепозиторий.** Домен и zod-схемы описываются один раз на фронт и бек
  (#46): без общего пакета форма `Task` описывалась бы дважды, а это рассинхрон по
  построению.
- **Деплой не усложняется.** Фронт и функции остаются одним сайтом Netlify и уезжают
  одним деплоем. Раздельные сборки из монорепозитория Netlify умеет
  ([docs.netlify.com/build/configure-builds/monorepos](https://docs.netlify.com/build/configure-builds/monorepos)),
  но они понадобятся, только если бек переедет на другой сервис — и тогда придут
  неатомарные деплои и CORS.
- **Раскладка:**

  ```
  eisenhower-todo/
    package.json          # workspaces: ["apps/*","packages/*"], только скрипты-оркестраторы
    netlify.toml          # publish = apps/web/dist, functions = apps/api/functions (#50)
    tsconfig.base.json
    eslint.config.base.js # общие правила и правило границ пакетов
    packages/core/        # @eisenhower/core: src/domain/ целиком; позже zod-схемы и контракты (#46)
    apps/web/             # нынешний src/{state,storage,ui,shared,styles}, vite.config.ts, index.html
    apps/api/             # #50
  ```

- **Схема Drizzle — в `apps/api`, не в `packages/core`.** Общее — форма `Task` и схемы
  zod, а не форма строки в базе; иначе `drizzle-orm` попал бы в браузерный бандл ради
  типов.
- **Алиас `@/` остаётся, но у каждого приложения свой.** Внутри `apps/web` исчезает только
  `@/domain` — он становится `@eisenhower/core`. Сам `src/domain/` при переезде не
  правится: он ни на что по алиасу не ссылается.
- **`@eisenhower/core` потребляется исходниками.** `exports` пакета указывает на
  `src/index.ts`, сборки у пакета нет: Vite и `tsc` с `moduleResolution: bundler` читают
  TypeScript напрямую.
- **Тесты живут у владельца кода** (2026-09-29). `tests/domain` → `packages/core/tests`,
  остальное → `apps/web/tests`; тесты бека — в `apps/api` (#50). У `packages/core` свой
  vitest в окружении `node` — без DOM, так что `CORE_IS_PORTABLE` проверяется и при
  запуске.
- **Конфиг линтеров — в каждом пакете** (2026-09-29). Общие правила
  (стрелочные функции, аннотации типов) и правило границ пакетов — в корневом
  `eslint.config.base.js`, пакет импортирует его и добавляет свои. Stylelint — только в
  `apps/web`: SCSS есть только там.
- **Зависимости — по владельцам** (2026-09-29). React, dnd-kit, radix, vite, jsdom,
  testing-library, sass — в `apps/web`; `fractional-indexing` — в `packages/core`;
  общий тулчейн (eslint, typescript, vitest, `@types/node`) — в корне. Версии не
  меняются.
- **Ветка.** Фаза одна, работа идёт прямо в `feature/48-monorepo`, PR — в `production`
  (2026-09-29, осознанное отступление от CLAUDE.md §3 для однофазной задачи).
- **Главный риск переезда** — globs в `eslint.config.js:68` и `:91-93` захардкожены на
  `src/`, а `tests/layer-boundaries.test.ts:9,70` прогоняет ESLint по этим путям. Не
  обновить их — и проверки границ слоёв выключатся молча, а `npm run lint` останется
  зелёным. Поэтому `LAYER_CHECKS_STILL_RUN`.

## Скоуп

**In**

- Корневой `package.json` с `workspaces: ["apps/*", "packages/*"]`, только
  скрипты-оркестраторы (`lint`, `build`, `test` по всем пакетам); `tsconfig.base.json`.
- `packages/core` (`@eisenhower/core`): переезд `src/domain/` целиком, без правок кода;
  `tests/domain` — туда же.
- `apps/web`: нынешние `src/{state,storage,ui,shared,styles}`, `vite.config.ts`,
  `index.html`, `public/`, остальные `tests/`.
- Замена импортов `@/domain` на `@eisenhower/core` (54 в `src`, 39 в `tests`; ещё один
  `@/domain/mutations` — в тесте, который уезжает в `packages/core`). Алиас `@/`
  остаётся, но только внутри `apps/web`.
- Globs в ESLint (сейчас `eslint.config.js:68`, `:91-93`, захардкожены на `src/`) и пути в
  `tests/layer-boundaries.test.ts` (`:9`, `:70`) — под новую раскладку.
- Границы между пакетами — правилами ESLint (см. `PACKAGE_BOUNDARIES`). npm workspaces
  такой импорт не запретят: пакеты лежат в общем `node_modules`, и запрещённый импорт
  соберётся.
- `netlify.toml` с `publish = apps/web/dist`.

**Out**

- `apps/api` — #50. Правило границ пишется так, чтобы `apps/api` попал под него без
  правки правила.
- zod-схемы и контракты ручек — появляются в #46, здесь переезжает только существующий
  код.
- Любое изменение поведения, домена, стора, хранилища, UI; обновление зависимостей и
  тулчейна.

**Допущения**

- Новых зависимостей нет: workspaces встроены в npm.

## Инварианты

- `BEHAVIOR_PRESERVED`: приложение ведёт себя как до переезда; существующий набор тестов
  зелёный без правок логики тестов — правятся только импорты и пути.
- `LAYER_CHECKS_STILL_RUN`: проверки границ слоёв внутри `apps/web` работают по новым
  путям. Намеренное нарушение границы роняет `npm run lint` и
  `tests/layer-boundaries.test.ts`.
- `PACKAGE_BOUNDARIES`: `packages/core` не импортирует ничего из `apps/*`; приложения не
  импортируют друг друга; общий код достаётся приложению только через
  `@eisenhower/core`, не относительным путём в чужой пакет. Держится ESLint, проверяется
  тестом с намеренным нарушением.
- `CORE_IS_PORTABLE`: `packages/core` не зависит от браузера (DOM, `window`,
  `localStorage`) и от React — его функции будут работать и на сервере (#46).
- `COMPILER_STILL_ON`: React Compiler применяется в сборке, дев-сервере и тестах — в
  трансформированном модуле есть `_c(` и импорт `react/compiler-runtime`.

## Критерии приёмки

- [ ] Given чистый клон When `npm install`, затем `npm run lint`, `npm run build`,
  `npm test` из корня Then все зелёные.
- [ ] Given намеренное нарушение границы слоя в `apps/web` Then lint и
  `tests/layer-boundaries.test.ts` падают.
- [ ] Given импорт из `apps/web` в `packages/core` Then lint падает.
- [ ] Given относительный импорт `../../packages/core/...` из `apps/web` Then lint падает.
- [ ] Given `npm run dev` When запросить `App.tsx` Then в модуле есть `_c(` и
  `react/compiler-runtime`.
- [ ] Given деплой-превью Netlify Then сайт открывается и работает как в `production`.
- [ ] В `apps/web` не осталось импортов `@/domain`.

## Фазы

- [ ] Фаза 1: переезд и границы — одна фаза: промежуточное состояние (код переехал,
  проверки ещё нет) — ровно то, что `LAYER_CHECKS_STILL_RUN` запрещает.

## Связи

Блокирует: #50, #53.
