import { ParkingOccupancySync } from './repositories/parking-occupancy-sync.js'
import { SensorReadingsRepository } from './repositories/sensor-readings.repository.js'

import type { OccupancyChangedIoTEvent } from './iot-event.js'
import { ledModeForStatus } from './led-mode.js'
import { IotDisplayCommandPublisher } from './publishers/iot-display-command.publisher.js'
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
  stateSynced: boolean
  freeSpots: number
  timestamp: string
}>

export type ProcessSensorReadingDependencies = Readonly<{
  env: SensorDataProcessorEnv
  sensorReadings: SensorReadingsRepository
  kafkaPublisher: KafkaOccupancyPublisher
  ledPublisher: IotLedCommandPublisher
  displayPublisher: IotDisplayCommandPublisher
  occupancySync: ParkingOccupancySync
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
  ledPublisher: new IotLedCommandPublisher(env),
  displayPublisher: new IotDisplayCommandPublisher(env),
  occupancySync: new ParkingOccupancySync()
})

export const processSensorReading = async (
  reading: OccupancyChangedIoTEvent,
  deps: ProcessSensorReadingDependencies
): Promise<SensorDataProcessorResponse> => {
  const record = await deps.sensorReadings.saveOccupancyReading(reading)
  await deps.kafkaPublisher.publishOccupancyChanged(reading)

  const status =
    reading.status === 'occupied' || reading.status === 'reserved'
      ? reading.status
      : 'free'

  // Update Redis + RDS so web/app/LCD reflect occupancy even if the
  // event-processor Kafka consumer is unhealthy.
  const sync = await deps.occupancySync.applySensorOccupancy(
    reading.spotId,
    status,
    deps.env.redisUrl,
    reading.occurredAt
  )

  const ledCommandPublished = await deps.ledPublisher.publishSpotMode(
    reading.spotId,
    ledModeForStatus(status)
  )

  if (sync.changed || sync.freeSpots >= 0) {
    await deps.displayPublisher.publishIdleFreeSpots(sync.freeSpots)
  }

  return {
    spotId: reading.spotId,
    status: reading.status,
    deviceId: reading.deviceId,
    dynamoPersisted: true,
    kafkaPublished: true,
    ledCommandPublished,
    stateSynced: sync.changed,
    freeSpots: sync.freeSpots,
    timestamp: record.timestamp
  }
}
