import { describe, expect, it, vi } from 'vitest'

import { SensorReadingsRepository } from './repositories/sensor-readings.repository.js'

import type { OccupancyChangedIoTEvent } from './iot-event.js'
import {
  processSensorReading,
  type ProcessSensorReadingDependencies
} from './process-sensor-reading.js'
import { IotLedCommandPublisher } from './publishers/iot-led-command.publisher.js'
import { KafkaOccupancyPublisher } from './publishers/kafka-occupancy.publisher.js'
import type { SensorDataProcessorEnv } from './read-env.js'

const baseEnv: SensorDataProcessorEnv = {
  sensorReadingsTableName: 'polaris-dev-SensorReadings',
  sensorReadingsTtlDays: 90,
  kafkaClientId: 'sensor-data-processor-test',
  ledCommandsEnabled: true,
  iotDataEndpoint: 'example.iot.us-east-2.amazonaws.com'
}

const occupancyReading: OccupancyChangedIoTEvent = {
  deviceId: 'actuators-01',
  spotId: 'spot-05',
  status: 'occupied',
  sensorType: 'fc-51',
  occurredAt: new Date('2025-06-19T15:00:00.000Z')
}

const buildDeps = (
  overrides: Partial<ProcessSensorReadingDependencies> = {}
): ProcessSensorReadingDependencies => ({
  env: baseEnv,
  sensorReadings: {
    saveOccupancyReading: vi.fn().mockResolvedValue({
      sensorId: 'spot-05',
      timestamp: '2025-06-19T15:00:00.000Z',
      deviceId: 'actuators-01',
      spotId: 'spot-05',
      status: 'occupied',
      sensorType: 'fc-51',
      event: 'occupancy_changed'
    })
  } as unknown as SensorReadingsRepository,
  kafkaPublisher: {
    publishOccupancyChanged: vi.fn().mockResolvedValue(undefined)
  } as unknown as KafkaOccupancyPublisher,
  ledPublisher: {
    publishSpotMode: vi.fn().mockResolvedValue(true)
  } as unknown as IotLedCommandPublisher,
  ...overrides
})

describe('processSensorReading', () => {
  it('persists to DynamoDB, publishes to Kafka, and publishes LED command', async () => {
    const deps = buildDeps()

    const result = await processSensorReading(occupancyReading, deps)

    expect(result.dynamoPersisted).toBe(true)
    expect(result.kafkaPublished).toBe(true)
    expect(result.ledCommandPublished).toBe(true)
    expect(result.spotId).toBe('spot-05')
    expect(deps.sensorReadings.saveOccupancyReading).toHaveBeenCalledWith(
      occupancyReading
    )
    expect(deps.kafkaPublisher.publishOccupancyChanged).toHaveBeenCalledWith(
      occupancyReading
    )
    expect(deps.ledPublisher.publishSpotMode).toHaveBeenCalledWith(
      'spot-05',
      'occupied'
    )
  })
})
