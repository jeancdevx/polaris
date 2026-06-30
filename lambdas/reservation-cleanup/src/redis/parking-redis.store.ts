import { createClient, type RedisClientType } from 'redis'

const PARKING_SPOT_KEY_PREFIX = 'parking:spot:'

export const PARKING_STATS_KEYS = {
  totalAvailable: 'parking:stats:total_available',
  totalReserved: 'parking:stats:total_reserved'
} as const

export class ParkingRedisStore {
  constructor(private readonly redisUrl: string) {}

  async markSpotFree(spotId: string): Promise<void> {
    const client = createClient({ url: this.redisUrl })
    await client.connect()

    try {
      const spotKey = `${PARKING_SPOT_KEY_PREFIX}${spotId}`

      await client
        .multi()
        .hSet(spotKey, { status: 'free' })
        .hDel(spotKey, ['userId', 'reservationId', 'occupiedSince'])
        .decr(PARKING_STATS_KEYS.totalReserved)
        .incr(PARKING_STATS_KEYS.totalAvailable)
        .exec()
    } finally {
      await client.quit()
    }
  }
}

export type { RedisClientType }
