import { SensorReadingsRepository } from './repositories/sensor-readings.repository.js'

import type { OccupancyChangedIoTEvent } from './iot-event.js'
import { ledModeForStatus } from './led-mode.js'
import { IotLedCommandPublisher } from './publishers/iot-led-command.publisher.js'
import { KafkaOccupancyPublisher } from './publishers/kafka-occupancy.publisher.js'
import type { SensorDataProcessorEnv } from './read-env.js'

export type SensorDataProcessorResponse = Readonly<{
  spotId: string
  status: string
  deviceId: string
  dynamoPersisted: boolean
  kafkaPublished: boolean
  ledCommandPublished: boolean
  timestamp: string
}>

export type ProcessSensorReadingDependencies = Readonly<{
  env: SensorDataProcessorEnv
  sensorReadings: SensorReadingsRepository
  kafkaPublisher: KafkaOccupancyPublisher
  ledPublisher: IotLedCommandPublisher
}>

export const createProcessSensorReadingDependencies = (
  env: SensorDataProcessorEnv
): ProcessSensorReadingDependencies => ({
  env,
  sensorReadings: new SensorReadingsRepository({
    tableName: env.sensorReadingsTableName,
    ttlDays: env.sensorReadingsTtlDays
  }),
  kafkaPublisher: new KafkaOccupancyPublisher(env.kafkaClientId),
  ledPublisher: new IotLedCommandPublisher(env)
})

export const processSensorReading = async (
  reading: OccupancyChangedIoTEvent,
  deps: ProcessSensorReadingDependencies
): Promise<SensorDataProcessorResponse> => {
  const record = await deps.sensorReadings.saveOccupancyReading(reading)
  await deps.kafkaPublisher.publishOccupancyChanged(reading)
  const ledCommandPublished = await deps.ledPublisher.publishSpotMode(
    reading.spotId,
    ledModeForStatus(reading.status)
  )

  return {
    spotId: reading.spotId,
    status: reading.status,
    deviceId: reading.deviceId,
    dynamoPersisted: true,
    kafkaPublished: true,
    ledCommandPublished,
    timestamp: record.timestamp
  }
}
