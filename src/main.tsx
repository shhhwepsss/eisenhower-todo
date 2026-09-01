import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { describeError } from '@/shared/errors';
import { createLog, getLogLevel } from '@/shared/logger';
import type { LogPayload, Logger } from '@/shared/logger';
import { App } from '@/ui/app';
import '@/styles/global.scss';

const log: Logger = createLog('main');

/**
 * Общая часть трёх колбэков React: у них разные типы второго аргумента, и роднит
 * их ровно `componentStack` — цепочка компонентов до места падения.
 */
type RenderErrorInfo = { componentStack?: string | undefined };

const describeRenderFailure = (error: unknown, info: RenderErrorInfo): LogPayload => {
  const failure: LogPayload = describeError(error);
  return { ...failure, componentStack: info.componentStack };
};

const container: HTMLElement | null = document.getElementById('root');
if (!container) {
  log.error('контейнер #root не найден в index.html — приложение не стартует');
  throw new Error('Root container #root not found in index.html');
}

/**
 * Ловушки на всё, что никто не поймал. Без них падение видно только в консоли
 * браузера и мимо логгера: без области, без уровня, без порога — то есть
 * невидимо для всего, чем логи потом фильтруют.
 */
window.addEventListener('error', (event: ErrorEvent): void => {
  const source: string = `${event.filename}:${event.lineno}:${event.colno}`;
  const failure: LogPayload = describeError(event.error);
  log.error('необработанное исключение', { source, ...failure });
});

window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent): void => {
  const failure: LogPayload = describeError(event.reason);
  log.error('промис отклонён, и его никто не поймал', failure);
});

log.info('старт приложения', { mode: import.meta.env.MODE, logLevel: getLogLevel() });

/**
 * Ошибку рендера React наружу не выбрасывает — он зовёт свои колбэки (React 19),
 * поэтому упавший компонент доходит до логгера только отсюда.
 */
const root: Root = createRoot(container, {
  onUncaughtError: (error, info) => {
    const failure: LogPayload = describeRenderFailure(error, info);
    log.error('рендер упал, экран не собран', failure);
  },
  onCaughtError: (error, info) => {
    const failure: LogPayload = describeRenderFailure(error, info);
    log.error('рендер упал, ошибку поймала граница', failure);
  },
  onRecoverableError: (error, info) => {
    const failure: LogPayload = describeRenderFailure(error, info);
    log.warn('React пережил ошибку и перерисовал сам', failure);
  },
});

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

log.debug('первый рендер запущен');
