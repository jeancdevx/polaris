import { KAFKA_TOPICS, type KafkaTopic } from '@polaris/shared-types'

import {
  parseAuditEvent,
  parseEntryProximityTelemetryEvent,
  parseOccupancyChangedEvent,
  parseReservationCancelledEvent,
  parseReservationCreatedEvent,
  parseRfidValidationEvent,
  parseVehicleEntryEvent,
  parseVehicleExitEvent,
  type AuditEvent,
  type EntryProximityTelemetryEvent,
  type OccupancyChangedEvent,
  type ProximityDetectedEvent,
  type ReservationCancelledEvent,
  type ReservationCreatedEvent,
  type RfidValidationEvent,
  type VehicleEntryEvent,
  type VehicleExitEvent
} from './event-schemas.js'

export {
  parseAuditEvent,
  parseEntryProximityTelemetryEvent,
  parseOccupancyChangedEvent,
  parseProximityDetectedEvent,
  parseReservationCancelledEvent,
  parseReservationCreatedEvent,
  parseRfidValidationEvent,
  parseVehicleEntryEvent,
  parseVehicleExitEvent,
  type AuditEvent,
  type EntryProximityTelemetryEvent,
  type OccupancyChangedEvent,
  type ProximityDetectedEvent,
  type ReservationCancelledEvent,
  type ReservationCreatedEvent,
  type RfidValidationEvent,
  type VehicleEntryEvent,
  type VehicleExitEvent
} from './event-schemas.js'

export {
  parseJsonValue,
  parseKafkaEnvelope,
  type KafkaEventEnvelope
} from './envelope.js'

export type ParsedKafkaEvent =
  | ReservationCreatedEvent
  | ReservationCancelledEvent
  | VehicleEntryEvent
  | VehicleExitEvent
  | EntryProximityTelemetryEvent
  | OccupancyChangedEvent
  | ProximityDetectedEvent
  | RfidValidationEvent
  | AuditEvent

export const parseKafkaEventByTopic = (
  topic: KafkaTopic,
  raw: unknown
): ParsedKafkaEvent => {
  switch (topic) {
    case KAFKA_TOPICS.RESERVATION_CREATED:
      return parseReservationCreatedEvent(raw)
    case KAFKA_TOPICS.RESERVATION_CANCELLED:
      return parseReservationCancelledEvent(raw)
    case KAFKA_TOPICS.VEHICLE_ENTRY:
      return parseVehicleEntryEvent(raw)
    case KAFKA_TOPICS.VEHICLE_EXIT:
      return parseVehicleExitEvent(raw)
    case KAFKA_TOPICS.SENSOR_OCCUPANCY:
      return parseOccupancyChangedEvent(raw)
    case KAFKA_TOPICS.SENSOR_PROXIMITY:
      return parseEntryProximityTelemetryEvent(raw)
    case KAFKA_TOPICS.RFID_VALIDATION:
      return parseRfidValidationEvent(raw)
    case KAFKA_TOPICS.AUDIT_EVENTS:
      return parseAuditEvent(raw)
    default: {
      const exhaustiveCheck: never = topic
      return exhaustiveCheck
    }
  }
}
