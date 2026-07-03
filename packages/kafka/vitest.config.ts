import { defineConfig, mergeConfig } from 'vitest/config'

import shared from '../../vitest.coverage.shared.js'

export default mergeConfig(
  shared,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
      coverage: {
        include: ['src/**/*.ts'],
        exclude: [
          'src/cli/**',
          'src/config/**',
          'src/consumer/**',
          'src/producer/**',
          'src/smoke/**',
          'src/schemas/index.ts'
        ]
      }
    }
  })
)
