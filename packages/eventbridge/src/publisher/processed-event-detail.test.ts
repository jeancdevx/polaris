import { describe, expect, it } from 'vitest'

import { buildProcessedParkingEventDetail } from './processed-event-detail.js'

describe('buildProcessedParkingEventDetail', () => {
  it('includes spot transition metadata', () => {
    const detail = buildProcessedParkingEventDetail({
      eventName: 'vehicle.entry',
      aggregateId: 'evt-001',
      occurredAt: '2025-06-19T10:00:00.000Z',
      parkingSpotId: 'spot-03',
      previousStatus: 'reserved',
      currentStatus: 'occupied',
      userId: 'usr-12345',
      reservationId: 'res-001',
      vehiclePlate: 'ABC-123',
      processedAt: new Date('2025-06-19T10:00:01.000Z')
    })

    expect(detail).toEqual({
      eventName: 'vehicle.entry',
      aggregateId: 'evt-001',
      occurredAt: '2025-06-19T10:00:00.000Z',
      processedAt: '2025-06-19T10:00:01.000Z',
      parkingSpotId: 'spot-03',
      previousStatus: 'reserved',
      currentStatus: 'occupied',
      userId: 'usr-12345',
      reservationId: 'res-001',
      vehiclePlate: 'ABC-123',
      deviceId: undefined,
      sensorType: undefined
    })
  })
})
