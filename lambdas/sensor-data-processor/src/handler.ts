import type { Handler } from 'aws-lambda'

import { instrumentLambdaHandler } from '@polaris/lambda-core'

import { parseEntryProximityIoTEvent } from './entry-proximity-iot-event.js'
import { parseOccupancyChangedIoTEvent } from './iot-event.js'
import {
  createProcessEntryProximityDependencies,
  processEntryProximityTelemetry,
  type EntryProximityProcessorResponse
} from './process-entry-proximity.js'
import {
  createProcessSensorReadingDependencies,
  processSensorReading,
  type SensorDataProcessorResponse
} from './process-sensor-reading.js'
import { readSensorDataProcessorEnv } from './read-env.js'

let occupancyDependencies = createProcessSensorReadingDependencies(
  readSensorDataProcessorEnv()
)
let proximityDependencies = createProcessEntryProximityDependencies(
  readSensorDataProcessorEnv()
)

export const resetSensorDataProcessorDependenciesForTests = (): void => {
  const env = readSensorDataProcessorEnv()
  occupancyDependencies = createProcessSensorReadingDependencies(env)
  proximityDependencies = createProcessEntryProximityDependencies(env)
}

export const handler: Handler<
  unknown,
  SensorDataProcessorResponse | EntryProximityProcessorResponse
> = instrumentLambdaHandler(
  { serviceName: 'sensor-data-processor' },
  async (event, _context, logger) => {
    try {
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
    } catch {
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
  }
)
