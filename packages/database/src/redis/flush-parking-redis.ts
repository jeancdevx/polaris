import {
  connectRedis,
  disconnectRedis,
  PARKING_LOCK_KEY_PREFIX,
  PARKING_SPOT_KEY_PATTERN,
  PARKING_STATS_KEYS,
  scanRedisKeyBatches
} from '@polaris/shared-utils'

const LEGACY_LOCK_PATTERN = 'parking:lock:*'
const LEGACY_SPOT_PATTERN = 'parking:spot:*'

const LEGACY_STATS_KEYS = [
  'parking:stats:total_available',
  'parking:stats:total_occupied',
  'parking:stats:total_reserved'
] as const

const deleteScannedKeys = async (
  client: Awaited<ReturnType<typeof connectRedis>>,
  match: string
): Promise<number> => {
  let deleted = 0

  for await (const keys of scanRedisKeyBatches(client, { match, count: 100 })) {
    for (const key of keys) {
      await client.del(key)
      deleted += 1
    }
  }

  return deleted
}

export type FlushParkingRedisResult = Readonly<{
  keysDeleted: number
}>

export const flushParkingRedis = async (
  redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'
): Promise<FlushParkingRedisResult> => {
  const client = await connectRedis(redisUrl)

  try {
    let keysDeleted = 0

    keysDeleted += await deleteScannedKeys(client, PARKING_SPOT_KEY_PATTERN)
    keysDeleted += await deleteScannedKeys(
      client,
      `${PARKING_LOCK_KEY_PREFIX}*`
    )
    keysDeleted += await deleteScannedKeys(client, LEGACY_SPOT_PATTERN)
    keysDeleted += await deleteScannedKeys(client, LEGACY_LOCK_PATTERN)

    const statsKeys = [
      PARKING_STATS_KEYS.totalAvailable,
      PARKING_STATS_KEYS.totalOccupied,
      PARKING_STATS_KEYS.totalReserved,
      ...LEGACY_STATS_KEYS
    ]

    for (const key of statsKeys) {
      keysDeleted += await client.del(key)
    }

    return { keysDeleted }
  } finally {
    await disconnectRedis(client)
  }
}
