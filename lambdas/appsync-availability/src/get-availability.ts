import { createDataSource, type ParkingSpotRow } from '@polaris/database'
import type { ParkingStatus } from '@polaris/shared-types'
import {
  connectRedis,
  disconnectRedis,
  scanRedisKeyBatches,
  sleep
} from '@polaris/shared-utils'

import { PARKING_SPOT_KEY_PREFIX } from './parking.constants.js'
import {
  buildParkingStatus,
  mapParkingSpotRow,
  mapRedisHashToParkingSpot
} from './parking.mapper.js'
import type { AppSyncAvailabilityEnv } from './read-env.js'

type DataSource = ReturnType<typeof createDataSource>

const connectTimeoutMs = 10_000
const redisConnectTimeoutMs = 5_000

let dataSource: DataSource | undefined
let initializePromise: Promise<DataSource> | undefined

const getDataSource = async (): Promise<DataSource> => {
  if (dataSource?.isInitialized) {
    return dataSource
  }

  if (!initializePromise) {
    dataSource = createDataSource()
    initializePromise = Promise.race([
      dataSource.initialize(),
      sleep(connectTimeoutMs).then(() => {
        throw new Error(`RDS initialize timed out after ${connectTimeoutMs}ms`)
      })
    ])
      .then(() => dataSource as DataSource)
      .catch(error => {
        initializePromise = undefined
        dataSource = undefined
        throw error
      })
  }

  return initializePromise
}

const tryGetAvailabilityFromRedis = async (
  redisUrl: string
): Promise<ParkingStatus | null> => {
  const client = await connectRedis(redisUrl, {
    socket: { connectTimeout: redisConnectTimeoutMs }
  })

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
  const source = await getDataSource()
  const repository = source.getRepository<ParkingSpotRow>('ParkingSpot')
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

export const resetAvailabilityDataSourceForTests = (): void => {
  dataSource = undefined
  initializePromise = undefined
}
