# eisenhower-todo

Матрица Эйзенхауэра и список задач в одном локальном приложении.

- Требования: [`docs/PRD.md`](docs/PRD.md)
- Архитектура и разбиение на фазы: [`docs/specs/4-architecture.md`](docs/specs/4-architecture.md)
- Правила работы над проектом: [`CLAUDE.md`](CLAUDE.md)

## Стек

Vite + React + TypeScript (`strict`), Vitest, ESLint.

## Команды

```bash
npm install
npm run dev      # дев-сервер
npm run build    # проверка типов + продовая сборка
npm run test     # тесты (vitest)
npm run lint     # eslint, включая границы слоёв
```

## Границы слоёв

Направление зависимостей `ui/ → state/ → domain/`, хранилище за портом
(`docs/specs/4-architecture.md` §4, §5). Две границы держит `eslint.config.js`,
а не договорённость:

- `STORAGE_IS_ISOLATED` — `ui/` не импортирует `storage/` и не трогает `localStorage`;
- `STATE_ACCESS_VIA_HOOKS` — `ui/` импортирует из `state/` только точку входа с хуками.

Что оба правила действительно срабатывают, проверяет
[`src/test/layer-boundaries.test.ts`](src/test/layer-boundaries.test.ts).
