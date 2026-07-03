import { dirname, resolve } from 'node:path'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'

import { syncParkingRedis } from '../redis/sync-parking-redis.js'

const loadDevEnv = (): void => {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
  const envLocalPath = resolve(packageRoot, '../../infra/local/.env.local')

  loadEnvFile(envLocalPath)
}

const main = async (): Promise<void> => {
  loadDevEnv()

  const result = await syncParkingRedis()

  process.stdout.write(
    `Synced ${result.spotsSynced} parking spots to Redis (${result.totalAvailable} free, ${result.totalOccupied} occupied, ${result.totalReserved} reserved)\n`
  )
}

main().catch(error => {
  process.stderr.write(
    `Failed to sync parking state to Redis: ${error instanceof Error ? error.message : String(error)}\n`
  )
  process.exit(1)
})
