import { defineConfig, mergeConfig } from 'vitest/config'

import shared from '../../vitest.coverage.shared.js'

const nestInfrastructure = [
  'src/main.ts',
  'src/**/*.module.ts',
  'src/**/redis.service.ts',
  'src/**/database.service.ts',
  'src/**/*.repository.ts'
]

export default mergeConfig(
  shared,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
      exclude: ['src/**/*.integration.test.ts'],
      coverage: {
        include: ['src/**/*.ts'],
        exclude: nestInfrastructure
      }
    }
  })
)
