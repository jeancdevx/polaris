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

export type RfidValidationEvent = KafkaEventEnvelope &
  Readonly<{
    rfidUid: string
    readerLocation: 'entry' | 'exit'
    deviceId: string
    valid: boolean
    reason?: string
    userId?: string
    reservationId?: string
    parkingSpotId?: string
    userType?: string
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
  parseWithFields(raw, (record, envelope) => {
    if (record.event !== 'proximity_detected') {
      throw kafkaMessageError(
        'INVALID_FIELD',
        'event must be proximity_detected'
      )
    }

    if (typeof record.distanceCm !== 'number') {
      throw kafkaMessageError('INVALID_FIELD', 'distanceCm must be a number')
    }

    return {
      ...envelope,
      deviceId: requireStringField(record, 'deviceId'),
      event: 'proximity_detected',
      distanceCm: record.distanceCm
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
      userId: optionalStringField(record, 'userId'),
      reservationId: optionalStringField(record, 'reservationId'),
      parkingSpotId: optionalStringField(record, 'parkingSpotId'),
      userType: optionalStringField(record, 'userType')
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
