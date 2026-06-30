import { resolve } from 'node:path'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')

loadEnvFile(resolve(repoRoot, 'infra/local/.env.local'))

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    hookTimeout: 180_000,
    testTimeout: 60_000
  }
})
