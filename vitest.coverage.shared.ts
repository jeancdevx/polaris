import { defineConfig } from 'vitest/config'

export const coverageThresholds = {
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80
} as const

export const coverageReporter = ['text', 'json-summary', 'lcov'] as const

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: [...coverageReporter],
      thresholds: { ...coverageThresholds }
    }
  }
})
