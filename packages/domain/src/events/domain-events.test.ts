import { describe, expect, it } from 'vitest'

import { KAFKA_TOPICS } from '@polaris/shared-types'

import {
  createEntryDeniedEvent,
  createOccupancyChangedEvent,
  createProximityDetectedEvent,
  createReservationCancelledEvent,
  createReservationCreatedEvent,
  createRfidValidatedEvent,
  createVehicleEnteredEvent,
  createVehicleExitedEvent,
  domainEventToJson
} from '../index.js'

describe('Domain events', () => {
  it('serializes reservation created event', () => {
    const event = createReservationCreatedEvent({
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      expiresAt: '2025-06-19T12:00:00.000Z'
    })
    const json = domainEventToJson(event)
    expect(event.eventName).toBe(KAFKA_TOPICS.RESERVATION_CREATED)
    expect(json).toMatchObject({
      eventName: KAFKA_TOPICS.RESERVATION_CREATED,
      aggregateId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03'
    })
  })

  it('serializes reservation cancelled event', () => {
    const event = createReservationCancelledEvent({
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      reason: 'expired'
    })
    expect(event.eventName).toBe(KAFKA_TOPICS.RESERVATION_CANCELLED)
    expect(event.payload.reason).toBe('expired')
  })

  it('serializes vehicle entry and exit events', () => {
    const entry = createVehicleEnteredEvent({
      eventId: 'evt-entry-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      vehiclePlate: 'ABC-1234',
      reservationId: 'res-001'
    })
    const exit = createVehicleExitedEvent({
      eventId: 'evt-exit-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      vehiclePlate: 'ABC-1234',
      reservationId: 'res-001'
    })
    expect(entry.eventName).toBe(KAFKA_TOPICS.VEHICLE_ENTRY)
    expect(exit.eventName).toBe(KAFKA_TOPICS.VEHICLE_EXIT)
  })

  it('serializes occupancy and proximity events', () => {
    const occupancy = createOccupancyChangedEvent({
      spotId: 'spot-05',
      status: 'occupied',
      deviceId: 'actuators-01'
    })
    const proximity = createProximityDetectedEvent({
      deviceId: 'entry-io-01',
      distanceCm: 8
    })
    expect(occupancy.eventName).toBe(KAFKA_TOPICS.SENSOR_OCCUPANCY)
    expect(proximity.eventName).toBe(KAFKA_TOPICS.SENSOR_PROXIMITY)
    expect(proximity.payload.distanceCm).toBe(8)
  })

  it('serializes rfid validation and denial events', () => {
    const validated = createRfidValidatedEvent({
      rfidUid: 'A3:BF:22:01',
      readerLocation: 'entry',
      deviceId: 'entry-io-01',
      result: { valid: true, userId: 'usr-12345' }
    })
    const denied = createEntryDeniedEvent({
      rfidUid: 'A3:BF:22:01',
      gate: 'entry',
      reason: 'no_active_reservation'
    })
    expect(validated.eventName).toBe(KAFKA_TOPICS.RFID_VALIDATION)
    expect(denied.eventName).toBe(KAFKA_TOPICS.AUDIT_EVENTS)
    expect(denied.payload.reason).toBe('no_active_reservation')
  })
})
