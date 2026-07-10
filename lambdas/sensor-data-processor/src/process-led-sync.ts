import type { ParkingSpotStatus } from '@polaris/shared-types'
import {
  connectRedis,
  disconnectRedis,
  parkingSpotKey
} from '@polaris/shared-utils'

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
}>

export const createProcessLedSyncDependencies = (
  env: SensorDataProcessorEnv
): ProcessLedSyncDependencies => ({
  env,
  ledPublisher: new IotLedCommandPublisher(env)
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

export const processLedSyncRequest = async (
  request: LedSyncRequestIoTEvent,
  deps: ProcessLedSyncDependencies
): Promise<LedSyncProcessorResponse> => {
  if (!deps.env.redisUrl) {
    throw new Error('REDIS_URL must be configured for LED sync')
  }

  const redis = await connectRedis(deps.env.redisUrl)
  let ledCommandsPublished = 0

  try {
    for (
      let spotNumber = request.spotFirst;
      spotNumber <= request.spotLast;
      ++spotNumber
    ) {
      const spotId = spotIdFromNumber(spotNumber)
      const status = readParkingSpotStatus(
        (await redis.hGet(parkingSpotKey(spotId), 'status')) ?? undefined
      )
      const published = await deps.ledPublisher.publishSpotMode(
        spotId,
        ledModeForStatus(status)
      )

      if (published) {
        ledCommandsPublished += 1
      }
    }
  } finally {
    await disconnectRedis(redis)
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
