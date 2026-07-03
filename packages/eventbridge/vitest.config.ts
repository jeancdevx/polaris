import { defineConfig, mergeConfig } from 'vitest/config'

import shared from '../../vitest.coverage.shared.js'

export default mergeConfig(
  shared,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
      exclude: ['src/**/*.integration.test.ts'],
      coverage: {
        include: ['src/**/*.ts'],
        exclude: [
          'src/config/**',
          'src/publisher/publish-event.ts',
          'src/constants.ts'
        ]
      }
    }
  })
)
