import { describe, expect, it, vi } from 'vitest'

import { KAFKA_TOPICS } from '@polaris/shared-types'

import { SensorOccupancyHandler } from './sensor-occupancy.handler.js'

describe('SensorOccupancyHandler', () => {
  it('still publishes LED when RDS occupancy is already applied', async () => {
    const parkingRepository = {
      applyOccupancyChange: vi.fn(async () => null)
    }
    const parkingRedisStore = {
      syncSpotTransition: vi.fn(),
      getTotalAvailable: vi.fn(),
      getSpotStatus: vi.fn(async () => 'occupied' as const)
    }
    const eventBridgePublisher = {
      publishProcessedParkingEvent: vi.fn()
    }
    const auditLogRepository = {
      insert: vi.fn()
    }
    const ledCommands = {
      publishSpotMode: vi.fn(async () => true)
    }
    const displayCommands = {
      publishIdleFreeSpots: vi.fn()
    }

    const handler = new SensorOccupancyHandler(
      parkingRepository as never,
      parkingRedisStore as never,
      eventBridgePublisher as never,
      auditLogRepository as never,
      ledCommands as never,
      displayCommands as never
    )

    await handler.handle({
      eventName: KAFKA_TOPICS.SENSOR_OCCUPANCY,
      aggregateId: 'spot-03',
      occurredAt: '2025-06-19T15:00:00.000Z',
      spotId: 'spot-03',
      status: 'occupied',
      deviceId: 'actuators-01',
      sensorType: 'fc-51'
    })

    expect(ledCommands.publishSpotMode).toHaveBeenCalledWith(
      'spot-03',
      'occupied'
    )
    expect(
      eventBridgePublisher.publishProcessedParkingEvent
    ).not.toHaveBeenCalled()
  })

  it('keeps blink_blue when sensor free hits a reserved spot', async () => {
    const parkingRepository = {
      applyOccupancyChange: vi.fn(async () => null)
    }
    const parkingRedisStore = {
      syncSpotTransition: vi.fn(),
      getTotalAvailable: vi.fn(),
      getSpotStatus: vi.fn(async () => 'reserved' as const)
    }
    const ledCommands = {
      publishSpotMode: vi.fn(async () => true)
    }

    const handler = new SensorOccupancyHandler(
      parkingRepository as never,
      parkingRedisStore as never,
      { publishProcessedParkingEvent: vi.fn() } as never,
      { insert: vi.fn() } as never,
      ledCommands as never,
      { publishIdleFreeSpots: vi.fn() } as never
    )

    await handler.handle({
      eventName: KAFKA_TOPICS.SENSOR_OCCUPANCY,
      aggregateId: 'spot-08',
      occurredAt: '2025-06-19T15:00:00.000Z',
      spotId: 'spot-08',
      status: 'free',
      deviceId: 'actuators-01',
      sensorType: 'fc-51'
    })

    expect(ledCommands.publishSpotMode).toHaveBeenCalledWith(
      'spot-08',
      'blink_blue'
    )
  })
})
