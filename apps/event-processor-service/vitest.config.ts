import { defineConfig, mergeConfig } from 'vitest/config'

import shared from '../../vitest.coverage.shared.js'

const nestInfrastructure = [
  'src/main.ts',
  'src/**/*.module.ts',
  'src/**/redis.service.ts',
  'src/**/database.service.ts',
  'src/**/kafka-consumer.service.ts',
  'src/**/*.repository.ts',
  'src/processing/parking/parking.repository.ts'
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
