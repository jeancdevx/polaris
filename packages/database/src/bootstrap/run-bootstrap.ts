import { userSchema } from '../entities/index.js'

import { runMigrations } from '../migrations/run-migrations.js'

import { createDataSource } from '../config/create-data-source.js'

import { syncParkingRedis } from '../redis/sync-parking-redis.js'
import { runSeed, type SeedResult } from '../seed/run-seed.js'
import {
  cognitoAdminExists,
  provisionCognitoAdmin,
  readCognitoAdminConfig,
  type CognitoAdminConfig
} from './cognito-admin.js'

export type BootstrapResult = Readonly<{
  skipped: boolean
  reason?: string
  seed?: SeedResult
  redisSynced?: boolean
  cognitoAdminCreated?: boolean
}>

export type BootstrapDeps = Readonly<{
  runMigrationsFn?: typeof runMigrations
  runSeedFn?: typeof runSeed
  syncParkingRedisFn?: typeof syncParkingRedis
  readCognitoAdminConfigFn?: typeof readCognitoAdminConfig
  cognitoAdminExistsFn?: typeof cognitoAdminExists
  provisionCognitoAdminFn?: typeof provisionCognitoAdmin
  getBootstrapStateFn?: () => Promise<BootstrapState>
}>

export type BootstrapState = Readonly<{
  userCount: number
  hasAdminInDb: boolean
}>

const countUsersAndFindAdmin = async (): Promise<BootstrapState> => {
  const dataSource = createDataSource()
  await dataSource.initialize()

  try {
    const userCount = await dataSource.getRepository(userSchema).count()
    const adminCount = await dataSource.getRepository(userSchema).count({
      where: { role: 'admin' }
    })

    return { userCount, hasAdminInDb: adminCount > 0 }
  } finally {
    await dataSource.destroy()
  }
}

const ensureCognitoAdmin = async (
  config: CognitoAdminConfig,
  deps: BootstrapDeps
): Promise<boolean> => {
  const existsFn = deps.cognitoAdminExistsFn ?? cognitoAdminExists
  const provisionFn = deps.provisionCognitoAdminFn ?? provisionCognitoAdmin

  if (await existsFn(config)) {
    return false
  }

  await provisionFn(config)
  return true
}

export const runBootstrapIfNeeded = async (
  deps: BootstrapDeps = {}
): Promise<BootstrapResult> => {
  const runMigrationsFn = deps.runMigrationsFn ?? runMigrations
  const runSeedFn = deps.runSeedFn ?? runSeed
  const syncParkingRedisFn = deps.syncParkingRedisFn ?? syncParkingRedis
  const readConfigFn = deps.readCognitoAdminConfigFn ?? readCognitoAdminConfig

  await runMigrationsFn()

  const { userCount, hasAdminInDb } = await (
    deps.getBootstrapStateFn ?? countUsersAndFindAdmin
  )()
  const cognitoConfig = readConfigFn()
  const hasAdminInCognito = await (
    deps.cognitoAdminExistsFn ?? cognitoAdminExists
  )(cognitoConfig)

  if (userCount > 0 && hasAdminInDb && hasAdminInCognito) {
    const seed = await runSeedFn()
    await syncParkingRedisFn()

    return {
      skipped: true,
      reason: 'database and Cognito admin already provisioned',
      seed,
      redisSynced: true
    }
  }

  if (userCount > 0 && hasAdminInDb && !hasAdminInCognito) {
    const seed = await runSeedFn()
    await syncParkingRedisFn()
    const cognitoAdminCreated = await ensureCognitoAdmin(cognitoConfig, deps)

    return {
      skipped: false,
      seed,
      redisSynced: true,
      cognitoAdminCreated
    }
  }

  if (userCount > 0) {
    return {
      skipped: true,
      reason:
        'database has data but no admin user; manual intervention required'
    }
  }

  const seed = await runSeedFn()
  await syncParkingRedisFn()
  const cognitoAdminCreated = await ensureCognitoAdmin(cognitoConfig, deps)

  return {
    skipped: false,
    seed,
    redisSynced: true,
    cognitoAdminCreated
  }
}
