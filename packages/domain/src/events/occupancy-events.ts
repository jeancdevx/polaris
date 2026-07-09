import type { ParkingSpotStatus } from '@polaris/shared-types'
import { KAFKA_TOPICS } from '@polaris/shared-types'

import { createDomainEvent, type DomainEvent } from './domain-event.js'

export const createOccupancyChangedEvent = (input: {
  spotId: string
  status: ParkingSpotStatus
  deviceId: string
  sensorType?: 'fc-51'
  occurredAt?: Date
}): DomainEvent =>
  createDomainEvent({
    eventName: KAFKA_TOPICS.SENSOR_OCCUPANCY,
    aggregateId: input.spotId,
    occurredAt: input.occurredAt,
    payload: {
      spotId: input.spotId,
      status: input.status,
      deviceId: input.deviceId,
      sensorType: input.sensorType ?? 'fc-51'
    }
  })

export const createProximityDetectedEvent = (input: {
  deviceId: string
  distanceCm: number
  occurredAt?: Date
}): DomainEvent =>
  createDomainEvent({
    eventName: KAFKA_TOPICS.SENSOR_PROXIMITY,
    aggregateId: input.deviceId,
    occurredAt: input.occurredAt,
    payload: {
      deviceId: input.deviceId,
      event: 'proximity_detected',
      distanceCm: input.distanceCm
    }
  })

export type EntryProximityTelemetryEventName =
  | 'proximity_detected'
  | 'proximity_timeout'
  | 'passage_in_progress'
  | 'passage_stalled'
  | 'exit_barrier_timeout'

export const createEntryProximityTelemetryEvent = (input: {
  deviceId: string
  event: EntryProximityTelemetryEventName
  distanceCm?: number
  gateState?: string
  occurredAt?: Date
}): DomainEvent =>
  createDomainEvent({
    eventName: KAFKA_TOPICS.SENSOR_PROXIMITY,
    aggregateId: input.deviceId,
    occurredAt: input.occurredAt,
    payload: {
      deviceId: input.deviceId,
      event: input.event,
      ...(input.distanceCm !== undefined
        ? { distanceCm: input.distanceCm }
        : {}),
      ...(input.gateState !== undefined ? { gateState: input.gateState } : {})
    }
  })
