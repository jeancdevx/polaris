import type { Handler } from 'aws-lambda'

import { instrumentLambdaHandler } from '@polaris/lambda-core'

import { parseEntryProximityIoTEvent } from './entry-proximity-iot-event.js'
import { parseOccupancyChangedIoTEvent } from './iot-event.js'
import { parseLedSyncRequestIoTEvent } from './led-sync-iot-event.js'
import {
  createProcessEntryProximityDependencies,
  processEntryProximityTelemetry,
  type EntryProximityProcessorResponse
} from './process-entry-proximity.js'
import {
  createProcessLedSyncDependencies,
  processLedSyncRequest,
  type LedSyncProcessorResponse
} from './process-led-sync.js'
import {
  createProcessSensorReadingDependencies,
  processSensorReading,
  type SensorDataProcessorResponse
} from './process-sensor-reading.js'
import { readSensorDataProcessorEnv } from './read-env.js'
import { detectSensorIoTEventKind } from './route-sensor-iot-event.js'

let occupancyDependencies = createProcessSensorReadingDependencies(
  readSensorDataProcessorEnv()
)
let proximityDependencies = createProcessEntryProximityDependencies(
  readSensorDataProcessorEnv()
)
let ledSyncDependencies = createProcessLedSyncDependencies(
  readSensorDataProcessorEnv()
)

export const resetSensorDataProcessorDependenciesForTests = (): void => {
  const env = readSensorDataProcessorEnv()
  occupancyDependencies = createProcessSensorReadingDependencies(env)
  proximityDependencies = createProcessEntryProximityDependencies(env)
  ledSyncDependencies = createProcessLedSyncDependencies(env)
}

export const handler: Handler<
  unknown,
  | SensorDataProcessorResponse
  | EntryProximityProcessorResponse
  | LedSyncProcessorResponse
> = instrumentLambdaHandler(
  { serviceName: 'sensor-data-processor' },
  async (event, _context, logger) => {
    const kind = detectSensorIoTEventKind(event)

    if (kind === 'occupancy') {
      const reading = parseOccupancyChangedIoTEvent(event)
      const result = await processSensorReading(reading, occupancyDependencies)

      logger.info('Sensor reading processed', {
        spotId: result.spotId,
        status: result.status,
        deviceId: result.deviceId,
        dynamoPersisted: result.dynamoPersisted,
        kafkaPublished: result.kafkaPublished
      })

      return result
    }

    if (kind === 'led_sync') {
      const syncRequest = parseLedSyncRequestIoTEvent(event)
      const result = await processLedSyncRequest(
        syncRequest,
        ledSyncDependencies
      )

      logger.info('LED sync request processed', {
        deviceId: result.deviceId,
        spotFirst: result.spotFirst,
        spotLast: result.spotLast,
        spotsSynced: result.spotsSynced,
        ledCommandsPublished: result.ledCommandsPublished
      })

      return result
    }

    const telemetry = parseEntryProximityIoTEvent(event)
    const result = await processEntryProximityTelemetry(
      telemetry,
      proximityDependencies
    )

    logger.info('Entry proximity telemetry processed', {
      deviceId: result.deviceId,
      event: result.event,
      kafkaPublished: result.kafkaPublished
    })

    return result
  }
)
