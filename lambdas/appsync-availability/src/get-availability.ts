import { createDataSource, type ParkingSpotRow } from '@polaris/database'
import type { ParkingStatus } from '@polaris/shared-types'
import {
  connectRedis,
  disconnectRedis,
  scanRedisKeyBatches
} from '@polaris/shared-utils'

import { PARKING_SPOT_KEY_PREFIX } from './parking.constants.js'
import {
  buildParkingStatus,
  mapParkingSpotRow,
  mapRedisHashToParkingSpot
} from './parking.mapper.js'
import type { AppSyncAvailabilityEnv } from './read-env.js'

let dataSource: ReturnType<typeof createDataSource> | undefined

const tryGetAvailabilityFromRedis = async (
  redisUrl: string
): Promise<ParkingStatus | null> => {
  const client = await connectRedis(redisUrl)

  try {
    const spots = []

    for await (const keys of scanRedisKeyBatches(client, {
      match: `${PARKING_SPOT_KEY_PREFIX}*`,
      count: 100
    })) {
      for (const key of keys) {
        const spotId = key.slice(PARKING_SPOT_KEY_PREFIX.length)
        const hash = await client.hGetAll(key)
        const spot = mapRedisHashToParkingSpot(spotId, hash)

        if (spot) {
          spots.push(spot)
        }
      }
    }

    if (spots.length === 0) {
      return null
    }

    return buildParkingStatus(spots)
  } catch {
    return null
  } finally {
    await disconnectRedis(client)
  }
}

const getAvailabilityFromRds = async (): Promise<ParkingStatus> => {
  if (!dataSource?.isInitialized) {
    dataSource = createDataSource()
    await dataSource.initialize()
  }

  const repository = dataSource.getRepository<ParkingSpotRow>('ParkingSpot')
  const rows = await repository.find({ order: { spotId: 'ASC' } })

  return buildParkingStatus(rows.map(mapParkingSpotRow))
}

export const getAvailability = async (
  env: AppSyncAvailabilityEnv
): Promise<ParkingStatus> => {
  const fromRedis = await tryGetAvailabilityFromRedis(env.redisUrl)

  if (fromRedis) {
    return fromRedis
  }

  return getAvailabilityFromRds()
}
