import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { findMonorepoRoot } from './load-local-env.js'

describe('findMonorepoRoot', () => {
  it('finds the repo root from a package directory', () => {
    const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
    const repoRoot = findMonorepoRoot(packageRoot)

    expect(repoRoot).toBe(findMonorepoRoot(join(packageRoot, 'src')))
  })
})
