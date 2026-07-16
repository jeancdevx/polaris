import { beforeEach, describe, expect, it, vi } from 'vitest'

import { runMigrations } from './run-migrations.js'

const mocks = vi.hoisted(() => ({
  createDataSourceAsync: vi.fn(),
  destroy: vi.fn(),
  initialize: vi.fn(),
  runMigrations: vi.fn()
}))

vi.mock('../config/create-data-source.js', () => ({
  createDataSourceAsync: mocks.createDataSourceAsync
}))

describe('runMigrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createDataSourceAsync.mockResolvedValue({
      destroy: mocks.destroy,
      initialize: mocks.initialize,
      runMigrations: mocks.runMigrations
    })
    mocks.runMigrations.mockResolvedValue([])
  })

  it('hydrates runtime credentials before creating the data source', async () => {
    await runMigrations()

    expect(mocks.createDataSourceAsync).toHaveBeenCalledOnce()
    expect(mocks.initialize).toHaveBeenCalledOnce()
    expect(mocks.runMigrations).toHaveBeenCalledOnce()
    expect(mocks.destroy).toHaveBeenCalledOnce()
  })
})
