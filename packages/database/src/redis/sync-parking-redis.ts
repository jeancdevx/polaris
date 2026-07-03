import { connectRedis, disconnectRedis } from '@polaris/shared-utils'

import { createDataSource, type ParkingSpotRow } from '../index.js'

const PARKING_SPOT_KEY_PREFIX = 'parking:spot:'

export type SyncParkingRedisResult = Readonly<{
  spotsSynced: number
  totalAvailable: number
  totalOccupied: number
  totalReserved: number
}>

export const syncParkingRedis = async (
  redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'
): Promise<SyncParkingRedisResult> => {
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

  const redis = await connectRedis(redisUrl)

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

    return {
      spotsSynced: rows.length,
      totalAvailable,
      totalOccupied,
      totalReserved
    }
  } finally {
    await disconnectRedis(redis)
  }
}
