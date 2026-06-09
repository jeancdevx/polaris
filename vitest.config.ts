import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'services/backend/*/src/**/*.test.ts',
      'services/lambdas/*/src/**/*.test.ts',
      'packages/*/src/**/*.test.ts'
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        '**/index.ts',
        'coverage/',
        'iac/',
        'firmware/',
        'apps/'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 30000
  }
})
