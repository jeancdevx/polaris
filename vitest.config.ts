import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'apps/*/src/**/*.test.ts',
      'lambdas/*/src/**/*.test.ts',
      'packages/*/src/**/*.test.ts'
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
    testTimeout: 30_000
  }
})
