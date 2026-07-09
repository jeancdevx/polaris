import { describe, expect, it, vi } from 'vitest'

import { runBootstrapIfNeeded } from './run-bootstrap.js'

const defaultCognitoConfig = {
  userPoolId: 'pool-1',
  awsRegion: 'us-east-2',
  adminEmail: 'admin@polaris.local',
  adminUserId: 'usr-admin01',
  adminPassword: 'secret'
}

const seedResult = { users: 3, parkingSpots: 10, rfidTags: 3 }

describe('runBootstrapIfNeeded', () => {
  it('syncs seed and redis when database and Cognito admin already exist', async () => {
    const runMigrationsFn = vi.fn().mockResolvedValue(undefined)
    const runSeedFn = vi.fn().mockResolvedValue(seedResult)
    const syncParkingRedisFn = vi.fn().mockResolvedValue(undefined)
    const provisionCognitoAdminFn = vi.fn()

    const result = await runBootstrapIfNeeded({
      runMigrationsFn,
      runSeedFn,
      syncParkingRedisFn,
      readCognitoAdminConfigFn: vi.fn().mockReturnValue(defaultCognitoConfig),
      getBootstrapStateFn: vi
        .fn()
        .mockResolvedValue({ userCount: 3, hasAdminInDb: true }),
      cognitoAdminExistsFn: vi.fn().mockResolvedValue(true),
      provisionCognitoAdminFn
    })

    expect(result.skipped).toBe(true)
    expect(result.seed).toEqual(seedResult)
    expect(result.redisSynced).toBe(true)
    expect(runMigrationsFn).toHaveBeenCalledOnce()
    expect(runSeedFn).toHaveBeenCalledOnce()
    expect(syncParkingRedisFn).toHaveBeenCalledOnce()
    expect(provisionCognitoAdminFn).not.toHaveBeenCalled()
  })

  it('runs full bootstrap on an empty database', async () => {
    const runMigrationsFn = vi.fn().mockResolvedValue(undefined)
    const runSeedFn = vi.fn().mockResolvedValue(seedResult)
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
    expect(result.seed).toEqual(seedResult)
    expect(result.redisSynced).toBe(true)
    expect(result.cognitoAdminCreated).toBe(true)
    expect(runSeedFn).toHaveBeenCalledOnce()
    expect(syncParkingRedisFn).toHaveBeenCalledOnce()
    expect(provisionCognitoAdminFn).toHaveBeenCalledOnce()
  })

  it('creates Cognito admin and syncs seed when RDS already has admin user', async () => {
    const runSeedFn = vi.fn().mockResolvedValue(seedResult)
    const syncParkingRedisFn = vi.fn().mockResolvedValue(undefined)
    const provisionCognitoAdminFn = vi.fn().mockResolvedValue(undefined)

    const result = await runBootstrapIfNeeded({
      runMigrationsFn: vi.fn().mockResolvedValue(undefined),
      runSeedFn,
      syncParkingRedisFn,
      readCognitoAdminConfigFn: vi.fn().mockReturnValue(defaultCognitoConfig),
      getBootstrapStateFn: vi
        .fn()
        .mockResolvedValue({ userCount: 3, hasAdminInDb: true }),
      cognitoAdminExistsFn: vi.fn().mockResolvedValue(false),
      provisionCognitoAdminFn
    })

    expect(result.skipped).toBe(false)
    expect(result.seed).toEqual(seedResult)
    expect(result.redisSynced).toBe(true)
    expect(result.cognitoAdminCreated).toBe(true)
    expect(runSeedFn).toHaveBeenCalledOnce()
    expect(syncParkingRedisFn).toHaveBeenCalledOnce()
    expect(provisionCognitoAdminFn).toHaveBeenCalledOnce()
  })
})
