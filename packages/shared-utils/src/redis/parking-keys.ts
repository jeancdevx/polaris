/**
 * ElastiCache cluster mode requires all keys in a MULTI/transaction to share one hash slot.
 * The `{parking}` tag forces spot, stats, and lock keys into the same slot.
 */
export const PARKING_REDIS_HASH_TAG = '{parking}'

export const PARKING_SPOT_KEY_PREFIX = `${PARKING_REDIS_HASH_TAG}:spot:`

export const PARKING_LOCK_KEY_PREFIX = `${PARKING_REDIS_HASH_TAG}:lock:`

export const PARKING_SPOT_KEY_PATTERN = `${PARKING_SPOT_KEY_PREFIX}*`

export const parkingSpotKey = (spotId: string): string =>
  `${PARKING_SPOT_KEY_PREFIX}${spotId}`

export const parkingLockKey = (spotId: string): string =>
  `${PARKING_LOCK_KEY_PREFIX}${spotId}`

export const spotIdFromParkingSpotKey = (key: string): string =>
  key.slice(PARKING_SPOT_KEY_PREFIX.length)

export const PARKING_STATS_KEYS = {
  totalAvailable: `${PARKING_REDIS_HASH_TAG}:stats:total_available`,
  totalOccupied: `${PARKING_REDIS_HASH_TAG}:stats:total_occupied`,
  totalReserved: `${PARKING_REDIS_HASH_TAG}:stats:total_reserved`
} as const
