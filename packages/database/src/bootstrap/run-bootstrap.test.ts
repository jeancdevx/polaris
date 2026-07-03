import { describe, expect, it, vi } from 'vitest'

import { runBootstrapIfNeeded } from './run-bootstrap.js'

const defaultCognitoConfig = {
  userPoolId: 'pool-1',
  awsRegion: 'us-east-2',
  adminEmail: 'admin@polaris.local',
  adminUserId: 'usr-admin01',
  adminPassword: 'secret'
}

describe('runBootstrapIfNeeded', () => {
  it('skips when database and Cognito admin already exist', async () => {
    const runMigrationsFn = vi.fn().mockResolvedValue(undefined)
    const runSeedFn = vi.fn()
    const syncParkingRedisFn = vi.fn()
    const provisionCognitoAdminFn = vi.fn()

    const result = await runBootstrapIfNeeded({
      runMigrationsFn,
      runSeedFn,
      syncParkingRedisFn,
      readCognitoAdminConfigFn: vi.fn().mockReturnValue(defaultCognitoConfig),
      getBootstrapStateFn: vi
        .fn()
        .mockResolvedValue({ userCount: 2, hasAdminInDb: true }),
      cognitoAdminExistsFn: vi.fn().mockResolvedValue(true),
      provisionCognitoAdminFn
    })

    expect(result.skipped).toBe(true)
    expect(runMigrationsFn).toHaveBeenCalledOnce()
    expect(runSeedFn).not.toHaveBeenCalled()
    expect(syncParkingRedisFn).not.toHaveBeenCalled()
    expect(provisionCognitoAdminFn).not.toHaveBeenCalled()
  })

  it('runs full bootstrap on an empty database', async () => {
    const seed = { users: 2, parkingSpots: 10, rfidTags: 2 }
    const runMigrationsFn = vi.fn().mockResolvedValue(undefined)
    const runSeedFn = vi.fn().mockResolvedValue(seed)
    const syncParkingRedisFn = vi.fn().mockResolvedValue({
      spotsSynced: 10,
      totalAvailable: 10,
      totalOccupied: 0,
      totalReserved: 0
    })
    const provisionCognitoAdminFn = vi.fn().mockResolvedValue(undefined)

    const result = await runBootstrapIfNeeded({
      runMigrationsFn,
      runSeedFn,
      syncParkingRedisFn,
      readCognitoAdminConfigFn: vi.fn().mockReturnValue(defaultCognitoConfig),
      getBootstrapStateFn: vi
        .fn()
        .mockResolvedValue({ userCount: 0, hasAdminInDb: false }),
      cognitoAdminExistsFn: vi.fn().mockResolvedValue(false),
      provisionCognitoAdminFn
    })

    expect(result.skipped).toBe(false)
    expect(result.seed).toEqual(seed)
    expect(result.redisSynced).toBe(true)
    expect(result.cognitoAdminCreated).toBe(true)
    expect(runSeedFn).toHaveBeenCalledOnce()
    expect(syncParkingRedisFn).toHaveBeenCalledOnce()
    expect(provisionCognitoAdminFn).toHaveBeenCalledOnce()
  })

  it('creates Cognito admin when RDS already has admin user', async () => {
    const provisionCognitoAdminFn = vi.fn().mockResolvedValue(undefined)

    const result = await runBootstrapIfNeeded({
      runMigrationsFn: vi.fn().mockResolvedValue(undefined),
      runSeedFn: vi.fn(),
      syncParkingRedisFn: vi.fn(),
      readCognitoAdminConfigFn: vi.fn().mockReturnValue(defaultCognitoConfig),
      getBootstrapStateFn: vi
        .fn()
        .mockResolvedValue({ userCount: 2, hasAdminInDb: true }),
      cognitoAdminExistsFn: vi.fn().mockResolvedValue(false),
      provisionCognitoAdminFn
    })

    expect(result.skipped).toBe(false)
    expect(result.cognitoAdminCreated).toBe(true)
    expect(provisionCognitoAdminFn).toHaveBeenCalledOnce()
  })
})
