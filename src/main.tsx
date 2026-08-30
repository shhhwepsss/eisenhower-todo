import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createLog } from '@/shared/logger';
import { App } from '@/ui/app';
import '@/styles/global.scss';

const log = createLog('main');

const container = document.getElementById('root');
if (!container) {
  log.error('контейнер #root не найден в index.html — приложение не стартует');
  throw new Error('Root container #root not found in index.html');
}

log.info('старт приложения', { mode: import.meta.env.MODE });

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
