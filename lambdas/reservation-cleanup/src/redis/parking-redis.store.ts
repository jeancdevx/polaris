import {
  connectRedis,
  disconnectRedis,
  PARKING_STATS_KEYS,
  parkingSpotKey,
  type PolarisRedisClient
} from '@polaris/shared-utils'

export class ParkingRedisStore {
  constructor(private readonly redisUrl: string) {}

  async markSpotFree(spotId: string): Promise<void> {
    const client = await connectRedis(this.redisUrl)

    try {
      const spotKey = parkingSpotKey(spotId)

      await client
        .multi()
        .hSet(spotKey, { status: 'free' })
        .hDel(spotKey, ['userId', 'reservationId', 'occupiedSince'])
        .decr(PARKING_STATS_KEYS.totalReserved)
        .incr(PARKING_STATS_KEYS.totalAvailable)
        .exec()
    } finally {
      await disconnectRedis(client)
    }
  }
}

export type { PolarisRedisClient }
