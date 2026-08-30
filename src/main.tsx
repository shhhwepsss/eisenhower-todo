import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/ui/app';
import '@/styles/global.scss';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container #root not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
