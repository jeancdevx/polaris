import { Test, type TestingModule } from '@nestjs/testing'
import { describe, expect, it } from 'vitest'

import { KAFKA_TOPICS } from '@polaris/shared-types'

import { SensorOccupancyHandler } from './handlers/sensor-occupancy.handler.js'
import { VehicleEntryHandler } from './handlers/vehicle-entry.handler.js'
import { VehicleExitHandler } from './handlers/vehicle-exit.handler.js'

import { EventDispatcherService } from './event-dispatcher.service.js'

describe('EventDispatcherService', () => {
  it('tracks processed messages by topic', async () => {
    const vehicleEntryHandler = {
      handle: async () => undefined
    }
    const vehicleExitHandler = {
      handle: async () => undefined
    }
    const sensorOccupancyHandler = {
      handle: async () => undefined
    }

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        EventDispatcherService,
        { provide: VehicleEntryHandler, useValue: vehicleEntryHandler },
        { provide: VehicleExitHandler, useValue: vehicleExitHandler },
        { provide: SensorOccupancyHandler, useValue: sensorOccupancyHandler }
      ]
    }).compile()

    const dispatcher = moduleRef.get(EventDispatcherService)

    await dispatcher.dispatch(
      {
        eventName: KAFKA_TOPICS.RESERVATION_CREATED,
        aggregateId: 'res-001',
        occurredAt: '2025-06-19T12:00:00.000Z',
        reservationId: 'res-001',
        userId: 'usr-12345',
        parkingSpotId: 'spot-03',
        expiresAt: '2025-06-19T13:00:00.000Z'
      },
      {
        topic: KAFKA_TOPICS.RESERVATION_CREATED,
        partition: 0,
        offset: '0',
        key: 'res-001',
        timestamp: '1'
      }
    )

    expect(dispatcher.getProcessedCount(KAFKA_TOPICS.RESERVATION_CREATED)).toBe(
      1
    )
    expect(dispatcher.getTotalProcessed()).toBe(1)
    expect(dispatcher.hasProcessedAllTopics()).toBe(false)
  })
})
