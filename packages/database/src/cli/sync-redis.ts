import { dirname, resolve } from 'node:path'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'

import { createClient } from 'redis'

import { createDataSource, type ParkingSpotRow } from '../index.js'

const PARKING_SPOT_KEY_PREFIX = 'parking:spot:'

const loadDevEnv = (): void => {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
  const envLocalPath = resolve(packageRoot, '../../infra/local/.env.local')

  loadEnvFile(envLocalPath)
}

const syncParkingRedis = async (): Promise<void> => {
  loadDevEnv()

  const dataSource = createDataSource()
  await dataSource.initialize()

  let rows: ParkingSpotRow[]

  try {
    rows = await dataSource.getRepository<ParkingSpotRow>('ParkingSpot').find({
      order: { spotId: 'ASC' }
    })
  } finally {
    await dataSource.destroy()
  }

  const redis = createClient({
    url: process.env.REDIS_URL ?? 'redis://localhost:6379'
  })

  await redis.connect()

  try {
    let totalAvailable = 0
    let totalOccupied = 0
    let totalReserved = 0

    for (const row of rows) {
      const hash: Record<string, string> = { status: row.status }

      if (row.userId) {
        hash.userId = row.userId
      }

      if (row.reservationId) {
        hash.reservationId = row.reservationId
      }

      if (row.occupiedSince) {
        hash.occupiedSince = String(row.occupiedSince.getTime())
      }

      await redis.hSet(`${PARKING_SPOT_KEY_PREFIX}${row.spotId}`, hash)

      if (row.status === 'free') {
        totalAvailable += 1
      } else if (row.status === 'occupied') {
        totalOccupied += 1
      } else if (row.status === 'reserved') {
        totalReserved += 1
      }
    }

    await redis.set('parking:stats:total_available', totalAvailable)
    await redis.set('parking:stats:total_occupied', totalOccupied)
    await redis.set('parking:stats:total_reserved', totalReserved)

    process.stdout.write(
      `Synced ${rows.length} parking spots to Redis (${totalAvailable} free, ${totalOccupied} occupied, ${totalReserved} reserved)\n`
    )
  } finally {
    await redis.quit()
  }
}

syncParkingRedis().catch(error => {
  process.stderr.write(
    `Failed to sync parking state to Redis: ${error instanceof Error ? error.message : String(error)}\n`
  )
  process.exit(1)
})
