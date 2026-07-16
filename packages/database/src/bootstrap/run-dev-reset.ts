import { runMigrations } from '../migrations/run-migrations.js'

import { createDataSourceAsync } from '../config/create-data-source.js'

import { flushParkingRedis } from '../redis/flush-parking-redis.js'
import { syncParkingRedis } from '../redis/sync-parking-redis.js'
import { runSeed, type SeedResult } from '../seed/run-seed.js'
import {
  provisionCognitoAdmin,
  readCognitoAdminConfig
} from './cognito-admin.js'

export type DevResetResult = Readonly<{
  seed: SeedResult
  redisKeysDeleted: number
  redisSynced: true
  cognitoAdminEnsured: boolean
}>

export const runDevReset = async (): Promise<DevResetResult> => {
  await runMigrations()

  const dataSource = await createDataSourceAsync()
  await dataSource.initialize()

  try {
    await dataSource.query(`
      TRUNCATE TABLE
        sensor_data,
        audit_logs,
        parking_sessions,
        reservations,
        rfid_tags,
        parking_spots,
        users
      RESTART IDENTITY CASCADE
    `)
  } finally {
    await dataSource.destroy()
  }

  const seed = await runSeed()
  const { keysDeleted } = await flushParkingRedis()
  await syncParkingRedis()

  // Always re-apply a permanent Cognito password after reset so Amplify login
  // does not stick in FORCE_CHANGE_PASSWORD when the secret lacks digits.
  await provisionCognitoAdmin(readCognitoAdminConfig())

  return {
    seed,
    redisKeysDeleted: keysDeleted,
    redisSynced: true,
    cognitoAdminEnsured: true
  }
}
