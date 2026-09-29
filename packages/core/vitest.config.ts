import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // Окружение node, а не jsdom: ядро не должно рассчитывать на браузер (CORE_IS_PORTABLE).
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
