import type { PolarisRedisClient } from './connect-redis.js'
import { PARKING_STATS_KEYS, parkingSpotKey } from './parking-keys.js'

export const PARKING_SPOT_COUNT = 10

export type ParkingStatsRecount = Readonly<{
  totalAvailable: number
  totalOccupied: number
  totalReserved: number
}>

const asStatus = (
  value: string | undefined
): 'free' | 'occupied' | 'reserved' => {
  if (value === 'occupied' || value === 'reserved') {
    return value
  }
  return 'free'
}

/** Count spot hashes spot-01..spot-10 and rewrite the Redis counters. */
export const recountAndSetParkingStats = async (
  redis: PolarisRedisClient
): Promise<ParkingStatsRecount> => {
  let totalAvailable = 0
  let totalOccupied = 0
  let totalReserved = 0

  for (let spotNumber = 1; spotNumber <= PARKING_SPOT_COUNT; ++spotNumber) {
    const spotId = `spot-${String(spotNumber).padStart(2, '0')}`
    const status = asStatus(
      (await redis.hGet(parkingSpotKey(spotId), 'status')) ?? undefined
    )

    if (status === 'free') {
      totalAvailable += 1
    } else if (status === 'occupied') {
      totalOccupied += 1
    } else {
      totalReserved += 1
    }
  }

  await redis
    .multi()
    .set(PARKING_STATS_KEYS.totalAvailable, totalAvailable)
    .set(PARKING_STATS_KEYS.totalOccupied, totalOccupied)
    .set(PARKING_STATS_KEYS.totalReserved, totalReserved)
    .exec()

  return { totalAvailable, totalOccupied, totalReserved }
}

export const clampFreeSpots = (freeSpots: number): number => {
  if (!Number.isFinite(freeSpots)) {
    return 0
  }
  return Math.max(0, Math.min(PARKING_SPOT_COUNT, Math.trunc(freeSpots)))
}
