import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    // The engine must never depend on wall-clock time or randomness.
    // "now" is always an explicit input.
    clearMocks: true,
  },
});
