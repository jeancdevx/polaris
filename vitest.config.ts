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
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        'coverage/',
        'iac/',
        'firmware/'
      ]
    },
    testTimeout: 30_000
  }
})
