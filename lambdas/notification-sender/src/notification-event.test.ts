import { describe, expect, it } from 'vitest'

import {
  buildNotificationMessage,
  parseNotificationEvent
} from './notification-event.js'

describe('notification-event', () => {
  it('parses reservation.created from EventBridge', () => {
    const event = parseNotificationEvent({
      source: 'polaris.reservation-service',
      'detail-type': 'reservation.created',
      detail: {
        reservationId: 'res-007',
        userId: 'usr-12345',
        parkingSpotId: 'spot-07',
        expiresAt: '2025-06-19T16:00:00.000Z'
      }
    })

    expect(event.detailType).toBe('reservation.created')
    expect(event.parkingSpotId).toBe('spot-07')
  })

  it('builds expired reservation message', () => {
    const message = buildNotificationMessage({
      detailType: 'reservation.cancelled',
      source: 'polaris.reservation-cleanup',
      aggregateId: 'res-001',
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      reason: 'expired'
    })

    expect(message).toContain('Plaza 03')
    expect(message).toContain('expirado')
  })
})
