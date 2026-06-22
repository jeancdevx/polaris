import { KAFKA_TOPICS } from '@polaris/shared-types'

import { createDomainEvent, type DomainEvent } from './domain-event.js'

export type RfidValidationResult = {
  valid: boolean
  reason?: string
  userId?: string
  reservationId?: string
  parkingSpotId?: string
  userType?: string
}

export type EntryDenialReason =
  | 'rfid_not_found_or_inactive'
  | 'no_active_reservation'
  | 'reservation_expired'
  | 'no_active_session'

export const createRfidValidatedEvent = (input: {
  rfidUid: string
  readerLocation: 'entry' | 'exit'
  deviceId: string
  result: RfidValidationResult
  occurredAt?: Date
}): DomainEvent =>
  createDomainEvent({
    eventName: KAFKA_TOPICS.RFID_VALIDATION,
    aggregateId: input.rfidUid,
    occurredAt: input.occurredAt,
    payload: {
      rfidUid: input.rfidUid,
      readerLocation: input.readerLocation,
      deviceId: input.deviceId,
      ...input.result
    }
  })

export const createEntryDeniedEvent = (input: {
  rfidUid: string
  gate: 'entry' | 'exit'
  reason: EntryDenialReason
  occurredAt?: Date
}): DomainEvent =>
  createDomainEvent({
    eventName: KAFKA_TOPICS.AUDIT_EVENTS,
    aggregateId: input.rfidUid,
    occurredAt: input.occurredAt,
    payload: {
      eventType: 'entry_denied',
      rfidUid: input.rfidUid,
      gate: input.gate,
      reason: input.reason
    }
  })
