import { describe, expect, it, vi } from 'vitest'

import { KAFKA_TOPICS } from '@polaris/shared-types'

import { VehicleEntryHandler } from './vehicle-entry.handler.js'

describe('VehicleEntryHandler', () => {
  it('syncs redis and publishes EventBridge on success', async () => {
    const parkingRepository = {
      applyVehicleEntry: vi.fn(async () => ({
        spot: {
          spotId: { value: 'spot-01' },
          status: 'occupied',
          userId: { value: 'usr-12345' },
          reservationId: { value: 'res-001' }
        },
        previousStatus: 'reserved'
      }))
    }
    const parkingRedisStore = {
      syncSpotTransition: vi.fn(async () => undefined)
    }
    const eventBridgePublisher = {
      publishProcessedParkingEvent: vi.fn(async () => undefined)
    }

    const handler = new VehicleEntryHandler(
      parkingRepository as never,
      parkingRedisStore as never,
      eventBridgePublisher as never
    )

    await handler.handle({
      eventName: KAFKA_TOPICS.VEHICLE_ENTRY,
      aggregateId: 'veh-001',
      occurredAt: '2025-06-19T10:00:00.000Z',
      eventId: 'veh-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-01',
      vehiclePlate: 'ABC-123',
      reservationId: 'res-001',
      gate: 'entry'
    })

    expect(parkingRedisStore.syncSpotTransition).toHaveBeenCalled()
    expect(
      eventBridgePublisher.publishProcessedParkingEvent
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        detailType: KAFKA_TOPICS.VEHICLE_ENTRY,
        parkingSpotId: 'spot-01',
        previousStatus: 'reserved',
        currentStatus: 'occupied'
      })
    )
  })
})
