import { describe, expect, it, vi } from 'vitest'

import { SensorReadingsRepository } from './repositories/sensor-readings.repository.js'

import type { OccupancyChangedIoTEvent } from './iot-event.js'
import {
  processSensorReading,
  type ProcessSensorReadingDependencies
} from './process-sensor-reading.js'
import { KafkaOccupancyPublisher } from './publishers/kafka-occupancy.publisher.js'
import type { SensorDataProcessorEnv } from './read-env.js'

const baseEnv: SensorDataProcessorEnv = {
  sensorReadingsTableName: 'polaris-dev-SensorReadings',
  sensorReadingsTtlDays: 90,
  kafkaClientId: 'sensor-data-processor-test',
  ledCommandsEnabled: true,
  iotDataEndpoint: 'example.iot.us-east-2.amazonaws.com',
  redisUrl: 'redis://localhost:6379'
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
  } as never,
  displayPublisher: {
    publishIdleFreeSpots: vi.fn().mockResolvedValue(true)
  } as never,
  occupancySync: {
    applySensorOccupancy: vi.fn().mockResolvedValue({
      previousStatus: 'free',
      currentStatus: 'occupied',
      freeSpots: 9,
      changed: true
    })
  } as never,
  ...overrides
})

describe('processSensorReading', () => {
  it('persists, syncs Redis/RDS state, commands LEDs and LCD', async () => {
    const deps = buildDeps()

    const result = await processSensorReading(occupancyReading, deps)

    expect(result.dynamoPersisted).toBe(true)
    expect(result.kafkaPublished).toBe(true)
    expect(result.ledCommandPublished).toBe(true)
    expect(result.stateSynced).toBe(true)
    expect(result.freeSpots).toBe(9)
    expect(deps.occupancySync.applySensorOccupancy).toHaveBeenCalledWith(
      'spot-05',
      'occupied',
      'redis://localhost:6379',
      occupancyReading.occurredAt
    )
    expect(deps.ledPublisher.publishSpotMode).toHaveBeenCalledWith(
      'spot-05',
      'occupied'
    )
    expect(deps.displayPublisher.publishIdleFreeSpots).toHaveBeenCalledWith(9)
  })

  it('keeps reserved LED mode when sensor reports free on a reserved bay', async () => {
    const deps = buildDeps({
      occupancySync: {
        applySensorOccupancy: vi.fn().mockResolvedValue({
          previousStatus: 'reserved',
          currentStatus: 'reserved',
          freeSpots: 8,
          changed: false
        })
      } as never
    })

    await processSensorReading(
      {
        ...occupancyReading,
        status: 'free',
        spotId: 'spot-08'
      },
      deps
    )

    expect(deps.ledPublisher.publishSpotMode).toHaveBeenCalledWith(
      'spot-08',
      'blink_blue'
    )
  })
})
