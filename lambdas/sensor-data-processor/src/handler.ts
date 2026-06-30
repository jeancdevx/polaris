import type { Handler } from 'aws-lambda'

import { instrumentLambdaHandler } from '@polaris/lambda-core'

import { parseOccupancyChangedIoTEvent } from './iot-event.js'
import {
  createProcessSensorReadingDependencies,
  processSensorReading,
  type SensorDataProcessorResponse
} from './process-sensor-reading.js'
import { readSensorDataProcessorEnv } from './read-env.js'

let dependencies = createProcessSensorReadingDependencies(
  readSensorDataProcessorEnv()
)

export const resetSensorDataProcessorDependenciesForTests = (): void => {
  dependencies = createProcessSensorReadingDependencies(
    readSensorDataProcessorEnv()
  )
}

export const handler: Handler<unknown, SensorDataProcessorResponse> =
  instrumentLambdaHandler(
    { serviceName: 'sensor-data-processor' },
    async (event, _context, logger) => {
      const reading = parseOccupancyChangedIoTEvent(event)
      const result = await processSensorReading(reading, dependencies)

      logger.info('Sensor reading processed', {
        spotId: result.spotId,
        status: result.status,
        deviceId: result.deviceId,
        dynamoPersisted: result.dynamoPersisted,
        kafkaPublished: result.kafkaPublished
      })

      return result
    }
  )
