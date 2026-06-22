import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { config } from 'dotenv'

const findRepoRoot = (startDir: string): string => {
  let current = startDir

  while (current !== dirname(current)) {
    if (existsSync(join(current, 'pnpm-workspace.yaml'))) {
      return current
    }

    current = dirname(current)
  }

  return startDir
}

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

export const loadEnv = (): void => {
  const repoRoot = findRepoRoot(packageRoot)
  const envFiles = [
    join(repoRoot, 'infra/local/.env'),
    join(repoRoot, 'infra/local/.env.local'),
    join(packageRoot, '.env'),
    join(packageRoot, '.env.local')
  ]

  for (const path of envFiles) {
    if (existsSync(path)) {
      config({ path, quiet: true })
    }
  }
}
