import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react({
      // React Compiler мемоизирует сам — ручные useMemo/useCallback/React.memo
      // в коде не пишем (CLAUDE.md §7).
      compiler: true,
    }),
  ],
  server: {
    // Явный IPv4: дефолтный host `localhost` Node ≥17 резолвит в ::1 и слушает
    // только IPv6-loopback, а на Windows этот адрес легко оказывается недоступен
    // (например, VPN-туннель вешает WFP-фильтр на весь IPv6) — дев-сервер тогда
    // не открывается ни по localhost, ни по 127.0.0.1.
    host: '127.0.0.1',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
