import type { ParkingSpotStatus } from '@polaris/shared-types'
import {
  connectRedis,
  disconnectRedis,
  parkingSpotKey
} from '@polaris/shared-utils'

import { ParkingSpotStatusRepository } from './repositories/parking-spot-status.repository.js'

import { ledModeForStatus } from './led-mode.js'
import type { LedSyncRequestIoTEvent } from './led-sync-iot-event.js'
import { IotLedCommandPublisher } from './publishers/iot-led-command.publisher.js'
import type { SensorDataProcessorEnv } from './read-env.js'

export type LedSyncProcessorResponse = Readonly<{
  deviceId: string
  spotFirst: number
  spotLast: number
  spotsSynced: number
  ledCommandsPublished: number
  timestamp: string
}>

export type ProcessLedSyncDependencies = Readonly<{
  env: SensorDataProcessorEnv
  ledPublisher: IotLedCommandPublisher
  parkingSpotStatus?: ParkingSpotStatusRepository
}>

export const createProcessLedSyncDependencies = (
  env: SensorDataProcessorEnv
): ProcessLedSyncDependencies => ({
  env,
  ledPublisher: new IotLedCommandPublisher(env),
  parkingSpotStatus: new ParkingSpotStatusRepository()
})

const spotIdFromNumber = (spotNumber: number): string =>
  `spot-${String(spotNumber).padStart(2, '0')}`

const readParkingSpotStatus = (
  value: string | undefined
): ParkingSpotStatus => {
  if (value === 'occupied' || value === 'reserved') {
    return value
  }

  return 'free'
}

const loadStatusesFromRds = async (
  deps: ProcessLedSyncDependencies,
  spotFirst: number,
  spotLast: number
): Promise<Map<string, ParkingSpotStatus>> => {
  const repository = deps.parkingSpotStatus ?? new ParkingSpotStatusRepository()
  const rows = await repository.listStatusesInRange(spotFirst, spotLast)
  return new Map(rows.map(row => [row.spotId, row.status]))
}

const loadStatusesFromRedis = async (
  redisUrl: string,
  spotFirst: number,
  spotLast: number
): Promise<Map<string, ParkingSpotStatus>> => {
  const redis = await connectRedis(redisUrl)
  const statuses = new Map<string, ParkingSpotStatus>()

  try {
    for (let spotNumber = spotFirst; spotNumber <= spotLast; ++spotNumber) {
      const spotId = spotIdFromNumber(spotNumber)
      statuses.set(
        spotId,
        readParkingSpotStatus(
          (await redis.hGet(parkingSpotKey(spotId), 'status')) ?? undefined
        )
      )
    }
  } finally {
    await disconnectRedis(redis)
  }

  return statuses
}

export const processLedSyncRequest = async (
  request: LedSyncRequestIoTEvent,
  deps: ProcessLedSyncDependencies
): Promise<LedSyncProcessorResponse> => {
  let ledCommandsPublished = 0
  let statuses = new Map<string, ParkingSpotStatus>()

  try {
    statuses = await loadStatusesFromRds(
      deps,
      request.spotFirst,
      request.spotLast
    )
  } catch {
    if (!deps.env.redisUrl) {
      throw new Error('LED sync requires RDS or REDIS_URL')
    }
    statuses = await loadStatusesFromRedis(
      deps.env.redisUrl,
      request.spotFirst,
      request.spotLast
    )
  }

  for (
    let spotNumber = request.spotFirst;
    spotNumber <= request.spotLast;
    ++spotNumber
  ) {
    const spotId = spotIdFromNumber(spotNumber)
    const status = statuses.get(spotId) ?? 'free'

    const published = await deps.ledPublisher.publishSpotMode(
      spotId,
      ledModeForStatus(status)
    )

    if (published) {
      ledCommandsPublished += 1
    }
  }

  return {
    deviceId: request.deviceId,
    spotFirst: request.spotFirst,
    spotLast: request.spotLast,
    spotsSynced: request.spotLast - request.spotFirst + 1,
    ledCommandsPublished,
    timestamp: request.occurredAt.toISOString()
  }
}
