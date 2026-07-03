import { describe, expect, it } from 'vitest'

import { isKafkaMessageError } from '../errors/kafka-message-error.js'

import { parseJsonValue } from './envelope.js'
import {
  parseOccupancyChangedEvent,
  parseReservationCancelledEvent,
  parseReservationCreatedEvent,
  parseVehicleEntryEvent,
  parseVehicleExitEvent
} from './event-schemas.js'

const baseEnvelope = {
  eventName: 'reservation.created',
  aggregateId: 'res-001',
  occurredAt: '2025-06-19T10:00:00.000Z'
}

describe('parseReservationCreatedEvent', () => {
  it('parses a valid reservation.created payload', () => {
    const event = parseReservationCreatedEvent({
      ...baseEnvelope,
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

describe('parseReservationCancelledEvent', () => {
  it('parses cancellation reason', () => {
    const event = parseReservationCancelledEvent({
      eventName: 'reservation.cancelled',
      aggregateId: 'res-001',
      occurredAt: '2025-06-19T10:00:00.000Z',
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      reason: 'expired'
    })

    expect(event.reason).toBe('expired')
  })
})

describe('parseVehicleEntryEvent', () => {
  it('parses vehicle entry payloads', () => {
    const event = parseVehicleEntryEvent({
      eventName: 'vehicle.entry',
      aggregateId: 'veh-001',
      occurredAt: '2025-06-19T10:00:00.000Z',
      eventId: 'veh-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-01',
      vehiclePlate: 'ABC-123',
      gate: 'entry'
    })

    expect(event.gate).toBe('entry')
    expect(event.vehiclePlate).toBe('ABC-123')
  })
})

describe('parseVehicleExitEvent', () => {
  it('parses vehicle exit payloads', () => {
    const event = parseVehicleExitEvent({
      eventName: 'vehicle.exit',
      aggregateId: 'veh-001',
      occurredAt: '2025-06-19T10:00:00.000Z',
      eventId: 'veh-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-01',
      vehiclePlate: 'ABC-123',
      gate: 'exit'
    })

    expect(event.gate).toBe('exit')
  })
})

describe('parseOccupancyChangedEvent', () => {
  it('parses occupancy sensor events', () => {
    const event = parseOccupancyChangedEvent({
      eventName: 'sensor.occupancy',
      aggregateId: 'spot-01',
      occurredAt: '2025-06-19T10:00:00.000Z',
      spotId: 'spot-01',
      status: 'occupied',
      deviceId: 'ir-01',
      sensorType: 'fc-51'
    })

    expect(event.status).toBe('occupied')
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
