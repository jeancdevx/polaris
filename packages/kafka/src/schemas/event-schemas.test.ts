import { describe, expect, it } from 'vitest'

import { isKafkaMessageError } from '../errors/kafka-message-error.js'

import { parseJsonValue } from './envelope.js'
import { parseReservationCreatedEvent } from './event-schemas.js'

describe('parseReservationCreatedEvent', () => {
  it('parses a valid reservation.created payload', () => {
    const event = parseReservationCreatedEvent({
      eventName: 'reservation.created',
      aggregateId: 'res-001',
      occurredAt: '2025-06-19T10:00:00.000Z',
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      expiresAt: '2025-06-19T12:00:00.000Z'
    })

    expect(event).toMatchObject({
      eventName: 'reservation.created',
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03'
    })
  })

  it('rejects invalid payloads', () => {
    try {
      parseReservationCreatedEvent({ eventName: 'reservation.created' })
      expect.fail('expected invalid payload')
    } catch (error) {
      expect(isKafkaMessageError(error)).toBe(true)
    }
  })
})

describe('parseJsonValue', () => {
  it('parses valid json strings', () => {
    expect(parseJsonValue('{"ok":true}')).toEqual({ ok: true })
  })

  it('rejects invalid json strings', () => {
    try {
      parseJsonValue('{invalid')
      expect.fail('expected invalid json')
    } catch (error) {
      expect(isKafkaMessageError(error)).toBe(true)
    }
  })
})
