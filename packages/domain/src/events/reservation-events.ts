import { KAFKA_TOPICS } from '@polaris/shared-types'

import { createDomainEvent, type DomainEvent } from './domain-event.js'

export const createReservationCreatedEvent = (input: {
  reservationId: string
  userId: string
  parkingSpotId: string
  expiresAt: string
  occurredAt?: Date
}): DomainEvent =>
  createDomainEvent({
    eventName: KAFKA_TOPICS.RESERVATION_CREATED,
    aggregateId: input.reservationId,
    occurredAt: input.occurredAt,
    payload: {
      reservationId: input.reservationId,
      userId: input.userId,
      parkingSpotId: input.parkingSpotId,
      expiresAt: input.expiresAt
    }
  })

export const createReservationCancelledEvent = (input: {
  reservationId: string
  userId: string
  parkingSpotId: string
  reason: 'user_cancelled' | 'expired' | 'admin'
  occurredAt?: Date
}): DomainEvent =>
  createDomainEvent({
    eventName: KAFKA_TOPICS.RESERVATION_CANCELLED,
    aggregateId: input.reservationId,
    occurredAt: input.occurredAt,
    payload: {
      reservationId: input.reservationId,
      userId: input.userId,
      parkingSpotId: input.parkingSpotId,
      reason: input.reason
    }
  })

export const createReservationCheckedInEvent = (input: {
  reservationId: string
  userId: string
  parkingSpotId: string
  occurredAt?: Date
}): DomainEvent =>
  createDomainEvent({
    eventName: 'reservation.checked_in',
    aggregateId: input.reservationId,
    occurredAt: input.occurredAt,
    payload: {
      reservationId: input.reservationId,
      userId: input.userId,
      parkingSpotId: input.parkingSpotId
    }
  })

export const createReservationCheckedOutEvent = (input: {
  reservationId: string
  userId: string
  parkingSpotId: string
  occurredAt?: Date
}): DomainEvent =>
  createDomainEvent({
    eventName: 'reservation.checked_out',
    aggregateId: input.reservationId,
    occurredAt: input.occurredAt,
    payload: {
      reservationId: input.reservationId,
      userId: input.userId,
      parkingSpotId: input.parkingSpotId
    }
  })
