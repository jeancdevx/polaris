import { describe, expect, it, vi } from 'vitest'

import { KAFKA_TOPICS } from '@polaris/shared-types'

import { ReservationCancelledHandler } from './reservation-cancelled.handler.js'
import { ReservationCreatedHandler } from './reservation-created.handler.js'

describe('ReservationCreatedHandler', () => {
  it('forwards reservation.created to EventBridge', async () => {
    const eventBridgePublisher = {
      publishReservationEvent: vi.fn(async () => undefined)
    }
    const ledCommands = {
      publishSpotMode: vi.fn(async () => true)
    }
    const displayCommands = {
      publishIdleFreeSpots: vi.fn(async () => true)
    }
    const parkingRedisStore = {
      getTotalAvailable: vi.fn(async () => 7)
    }

    const handler = new ReservationCreatedHandler(
      eventBridgePublisher as never,
      ledCommands as never,
      displayCommands as never,
      parkingRedisStore as never
    )

    await handler.handle({
      eventName: KAFKA_TOPICS.RESERVATION_CREATED,
      aggregateId: 'res-001',
      occurredAt: '2025-06-19T10:00:00.000Z',
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      expiresAt: '2025-06-19T12:00:00.000Z'
    })

    expect(eventBridgePublisher.publishReservationEvent).toHaveBeenCalledWith({
      detailType: KAFKA_TOPICS.RESERVATION_CREATED,
      eventName: KAFKA_TOPICS.RESERVATION_CREATED,
      aggregateId: 'res-001',
      occurredAt: '2025-06-19T10:00:00.000Z',
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      previousStatus: 'free',
      currentStatus: 'reserved',
      expiresAt: '2025-06-19T12:00:00.000Z'
    })
  })
})

describe('ReservationCancelledHandler', () => {
  it('forwards reservation.cancelled to EventBridge', async () => {
    const eventBridgePublisher = {
      publishReservationEvent: vi.fn(async () => undefined)
    }
    const ledCommands = {
      publishSpotMode: vi.fn(async () => true)
    }
    const displayCommands = {
      publishIdleFreeSpots: vi.fn(async () => true)
    }
    const parkingRedisStore = {
      getTotalAvailable: vi.fn(async () => 8)
    }

    const handler = new ReservationCancelledHandler(
      eventBridgePublisher as never,
      ledCommands as never,
      displayCommands as never,
      parkingRedisStore as never
    )

    await handler.handle({
      eventName: KAFKA_TOPICS.RESERVATION_CANCELLED,
      aggregateId: 'res-001',
      occurredAt: '2025-06-19T10:00:00.000Z',
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      reason: 'user_cancelled'
    })

    expect(eventBridgePublisher.publishReservationEvent).toHaveBeenCalledWith({
      detailType: KAFKA_TOPICS.RESERVATION_CANCELLED,
      eventName: KAFKA_TOPICS.RESERVATION_CANCELLED,
      aggregateId: 'res-001',
      occurredAt: '2025-06-19T10:00:00.000Z',
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      previousStatus: 'reserved',
      currentStatus: 'free',
      reason: 'user_cancelled'
    })
  })
})
