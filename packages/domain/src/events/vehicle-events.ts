import { KAFKA_TOPICS } from '@polaris/shared-types'

import { createDomainEvent, type DomainEvent } from './domain-event.js'

export const createVehicleEnteredEvent = (input: {
  eventId: string
  userId: string
  parkingSpotId: string
  vehiclePlate: string
  reservationId?: string
  gate?: 'entry'
  occurredAt?: Date
}): DomainEvent =>
  createDomainEvent({
    eventName: KAFKA_TOPICS.VEHICLE_ENTRY,
    aggregateId: input.eventId,
    occurredAt: input.occurredAt,
    payload: {
      eventId: input.eventId,
      userId: input.userId,
      parkingSpotId: input.parkingSpotId,
      vehiclePlate: input.vehiclePlate,
      reservationId: input.reservationId,
      gate: input.gate ?? 'entry'
    }
  })

export const createVehicleExitedEvent = (input: {
  eventId: string
  userId: string
  parkingSpotId: string
  vehiclePlate: string
  reservationId?: string
  gate?: 'exit'
  occurredAt?: Date
}): DomainEvent =>
  createDomainEvent({
    eventName: KAFKA_TOPICS.VEHICLE_EXIT,
    aggregateId: input.eventId,
    occurredAt: input.occurredAt,
    payload: {
      eventId: input.eventId,
      userId: input.userId,
      parkingSpotId: input.parkingSpotId,
      vehiclePlate: input.vehiclePlate,
      reservationId: input.reservationId,
      gate: input.gate ?? 'exit'
    }
  })
