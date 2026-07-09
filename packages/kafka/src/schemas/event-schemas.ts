import type { ParkingSpotStatus } from '@polaris/shared-types'

import { kafkaMessageError } from '../errors/kafka-message-error.js'

import {
  optionalStringField,
  parseKafkaEnvelope,
  requireStringField,
  type KafkaEventEnvelope
} from './envelope.js'

export type ReservationCreatedEvent = KafkaEventEnvelope &
  Readonly<{
    reservationId: string
    userId: string
    parkingSpotId: string
    expiresAt: string
  }>

export type ReservationCancelledEvent = KafkaEventEnvelope &
  Readonly<{
    reservationId: string
    userId: string
    parkingSpotId: string
    reason: 'user_cancelled' | 'expired' | 'admin'
  }>

export type VehicleEntryEvent = KafkaEventEnvelope &
  Readonly<{
    eventId: string
    userId: string
    parkingSpotId: string
    vehiclePlate: string
    reservationId?: string
    gate: 'entry'
  }>

export type VehicleExitEvent = KafkaEventEnvelope &
  Readonly<{
    eventId: string
    userId: string
    parkingSpotId: string
    vehiclePlate: string
    reservationId?: string
    gate: 'exit'
  }>

export type OccupancyChangedEvent = KafkaEventEnvelope &
  Readonly<{
    spotId: string
    status: ParkingSpotStatus
    deviceId: string
    sensorType: 'fc-51'
  }>

export type ProximityDetectedEvent = KafkaEventEnvelope &
  Readonly<{
    deviceId: string
    event: 'proximity_detected'
    distanceCm: number
  }>

export type EntryProximityTelemetryEvent = KafkaEventEnvelope &
  Readonly<{
    deviceId: string
    event:
      | 'proximity_detected'
      | 'proximity_timeout'
      | 'passage_in_progress'
      | 'passage_stalled'
      | 'exit_barrier_timeout'
    distanceCm?: number
    gateState?: string
  }>

export type RfidValidationEvent = KafkaEventEnvelope &
  Readonly<{
    rfidUid: string
    readerLocation: 'entry' | 'exit'
    deviceId: string
    valid: boolean
    reason?: string
    accessType?: 'reserved' | 'walk_in'
    sessionId?: string
    userId?: string
    reservationId?: string
    parkingSpotId?: string
    userType?: string
    vehiclePlate?: string
  }>

export type AuditEvent = KafkaEventEnvelope &
  Readonly<{
    eventType: string
    rfidUid?: string
    gate?: 'entry' | 'exit'
    reason?: string
    userId?: string
    parkingSpotId?: string
    metadata?: Record<string, unknown>
  }>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const parseWithFields = <T extends KafkaEventEnvelope>(
  raw: unknown,
  build: (record: Record<string, unknown>, envelope: KafkaEventEnvelope) => T
): T => {
  if (!isRecord(raw)) {
    throw kafkaMessageError(
      'INVALID_PAYLOAD',
      'Event payload must be an object'
    )
  }

  return build(raw, parseKafkaEnvelope(raw))
}

const parseParkingSpotStatus = (value: unknown): ParkingSpotStatus => {
  if (value === 'free' || value === 'occupied' || value === 'reserved') {
    return value
  }

  throw kafkaMessageError(
    'INVALID_FIELD',
    'status must be free, occupied, or reserved'
  )
}

const parseCancellationReason = (
  value: unknown
): ReservationCancelledEvent['reason'] => {
  if (value === 'user_cancelled' || value === 'expired' || value === 'admin') {
    return value
  }

  throw kafkaMessageError(
    'INVALID_FIELD',
    'reason must be user_cancelled, expired, or admin'
  )
}

export const parseReservationCreatedEvent = (
  raw: unknown
): ReservationCreatedEvent =>
  parseWithFields(raw, (record, envelope) => ({
    ...envelope,
    reservationId: requireStringField(record, 'reservationId'),
    userId: requireStringField(record, 'userId'),
    parkingSpotId: requireStringField(record, 'parkingSpotId'),
    expiresAt: requireStringField(record, 'expiresAt')
  }))

export const parseReservationCancelledEvent = (
  raw: unknown
): ReservationCancelledEvent =>
  parseWithFields(raw, (record, envelope) => ({
    ...envelope,
    reservationId: requireStringField(record, 'reservationId'),
    userId: requireStringField(record, 'userId'),
    parkingSpotId: requireStringField(record, 'parkingSpotId'),
    reason: parseCancellationReason(record.reason)
  }))

export const parseVehicleEntryEvent = (raw: unknown): VehicleEntryEvent =>
  parseWithFields(raw, (record, envelope) => ({
    ...envelope,
    eventId: requireStringField(record, 'eventId'),
    userId: requireStringField(record, 'userId'),
    parkingSpotId: requireStringField(record, 'parkingSpotId'),
    vehiclePlate: requireStringField(record, 'vehiclePlate'),
    reservationId: optionalStringField(record, 'reservationId'),
    gate: 'entry'
  }))

export const parseVehicleExitEvent = (raw: unknown): VehicleExitEvent =>
  parseWithFields(raw, (record, envelope) => ({
    ...envelope,
    eventId: requireStringField(record, 'eventId'),
    userId: requireStringField(record, 'userId'),
    parkingSpotId: requireStringField(record, 'parkingSpotId'),
    vehiclePlate: requireStringField(record, 'vehiclePlate'),
    reservationId: optionalStringField(record, 'reservationId'),
    gate: 'exit'
  }))

export const parseOccupancyChangedEvent = (
  raw: unknown
): OccupancyChangedEvent =>
  parseWithFields(raw, (record, envelope) => ({
    ...envelope,
    spotId: requireStringField(record, 'spotId'),
    status: parseParkingSpotStatus(record.status),
    deviceId: requireStringField(record, 'deviceId'),
    sensorType: 'fc-51'
  }))

export const parseProximityDetectedEvent = (
  raw: unknown
): ProximityDetectedEvent =>
  parseEntryProximityTelemetryEvent(raw) as ProximityDetectedEvent

const parseEntryProximityEventName = (
  value: unknown
): EntryProximityTelemetryEvent['event'] => {
  if (
    value === 'proximity_detected' ||
    value === 'proximity_timeout' ||
    value === 'passage_in_progress' ||
    value === 'passage_stalled' ||
    value === 'exit_barrier_timeout'
  ) {
    return value
  }

  throw kafkaMessageError(
    'INVALID_FIELD',
    'event is not a supported proximity telemetry value'
  )
}

export const parseEntryProximityTelemetryEvent = (
  raw: unknown
): EntryProximityTelemetryEvent =>
  parseWithFields(raw, (record, envelope) => {
    const event = parseEntryProximityEventName(record.event)
    const distanceCm =
      typeof record.distanceCm === 'number'
        ? record.distanceCm
        : typeof record.distance_cm === 'number'
          ? record.distance_cm
          : undefined

    if (event === 'proximity_detected' && distanceCm === undefined) {
      throw kafkaMessageError(
        'INVALID_FIELD',
        'distanceCm is required for proximity_detected'
      )
    }

    const gateState =
      typeof record.gateState === 'string'
        ? record.gateState
        : typeof record.gate_state === 'string'
          ? record.gate_state
          : undefined

    return {
      ...envelope,
      deviceId: requireStringField(record, 'deviceId'),
      event,
      ...(distanceCm !== undefined ? { distanceCm } : {}),
      ...(gateState !== undefined ? { gateState } : {})
    }
  })

export const parseRfidValidationEvent = (raw: unknown): RfidValidationEvent =>
  parseWithFields(raw, (record, envelope) => {
    if (typeof record.valid !== 'boolean') {
      throw kafkaMessageError('INVALID_FIELD', 'valid must be a boolean')
    }

    const readerLocation = record.readerLocation
    if (readerLocation !== 'entry' && readerLocation !== 'exit') {
      throw kafkaMessageError(
        'INVALID_FIELD',
        'readerLocation must be entry or exit'
      )
    }

    return {
      ...envelope,
      rfidUid: requireStringField(record, 'rfidUid'),
      readerLocation,
      deviceId: requireStringField(record, 'deviceId'),
      valid: record.valid,
      reason: optionalStringField(record, 'reason'),
      accessType:
        record.accessType === 'reserved' || record.accessType === 'walk_in'
          ? record.accessType
          : undefined,
      sessionId: optionalStringField(record, 'sessionId'),
      userId: optionalStringField(record, 'userId'),
      reservationId: optionalStringField(record, 'reservationId'),
      parkingSpotId: optionalStringField(record, 'parkingSpotId'),
      userType: optionalStringField(record, 'userType'),
      vehiclePlate: optionalStringField(record, 'vehiclePlate')
    }
  })

export const parseAuditEvent = (raw: unknown): AuditEvent =>
  parseWithFields(raw, (record, envelope) => ({
    ...envelope,
    eventType: requireStringField(record, 'eventType'),
    rfidUid: optionalStringField(record, 'rfidUid'),
    gate:
      record.gate === 'entry' || record.gate === 'exit'
        ? record.gate
        : undefined,
    reason: optionalStringField(record, 'reason'),
    userId: optionalStringField(record, 'userId'),
    parkingSpotId: optionalStringField(record, 'parkingSpotId'),
    metadata: isRecord(record.metadata) ? record.metadata : undefined
  }))
