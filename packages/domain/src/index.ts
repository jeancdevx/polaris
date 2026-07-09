export {
  businessRuleViolation,
  invalidValue,
  isBusinessRuleViolationError,
  isInvalidValueError
} from './errors/domain-error.js'
export type {
  BusinessRuleViolationError,
  DomainError,
  InvalidValueError
} from './errors/domain-error.js'

export {
  canReserveParkingSpot,
  createFreeParkingSpot,
  markParkingSpotFree,
  markParkingSpotOccupied,
  releaseParkingSpotReservation,
  reserveParkingSpot,
  restoreParkingSpot
} from './entities/parking-spot.js'
export type { ParkingSpot } from './entities/parking-spot.js'

export {
  cancelReservation,
  canValidateReservationEntry,
  checkInReservation,
  checkOutReservation,
  createReservation,
  expireReservation,
  hasOpenReservationSession,
  isReservationExpired,
  restoreReservation
} from './entities/reservation.js'
export type {
  CreateReservationInput,
  Reservation
} from './entities/reservation.js'

export {
  activateRfidTag,
  createRfidTag,
  deactivateRfidTag,
  isRfidTagValid,
  restoreRfidTag,
  validateRfidTagForEntry
} from './entities/rfid-tag.js'
export type { CreateRfidTagInput, RfidTag } from './entities/rfid-tag.js'

export {
  activateUser,
  canUserAuthenticate,
  createUser,
  deactivateUser,
  restoreUser,
  updateUserProfile
} from './entities/user.js'
export type { CreateUserInput, User } from './entities/user.js'

export { createDomainEvent, domainEventToJson } from './events/domain-event.js'
export type { DomainEvent, DomainEventPayload } from './events/domain-event.js'

export {
  createEntryProximityTelemetryEvent,
  createOccupancyChangedEvent,
  createProximityDetectedEvent
} from './events/occupancy-events.js'
export type { EntryProximityTelemetryEventName } from './events/occupancy-events.js'

export {
  createReservationCancelledEvent,
  createReservationCheckedInEvent,
  createReservationCheckedOutEvent,
  createReservationCreatedEvent
} from './events/reservation-events.js'

export {
  createAccessDeniedEvent,
  createEntryDeniedEvent,
  createRfidValidatedEvent
} from './events/rfid-events.js'
export type {
  AccessDenialReason,
  EntryDenialReason,
  ParkingAccessType,
  RfidValidationResult
} from './events/rfid-events.js'

export {
  createVehicleEnteredEvent,
  createVehicleExitedEvent
} from './events/vehicle-events.js'

export {
  createEmail,
  emailEquals,
  emailToString
} from './value-objects/email.js'
export type { Email } from './value-objects/email.js'

export {
  createReservationId,
  createUserId,
  reservationIdEquals,
  userIdEquals
} from './value-objects/entity-id.js'
export type { ReservationId, UserId } from './value-objects/entity-id.js'

export {
  createRfidUid,
  rfidUidEquals,
  rfidUidToString
} from './value-objects/rfid-uid.js'
export type { RfidUid } from './value-objects/rfid-uid.js'

export {
  allSpotIds,
  createSpotId,
  spotIdEquals,
  spotIdToString
} from './value-objects/spot-id.js'
export type { ParkingZone, SpotId } from './value-objects/spot-id.js'

export {
  createVehiclePlate,
  vehiclePlateEquals,
  vehiclePlateToString
} from './value-objects/vehicle-plate.js'
export type { VehiclePlate } from './value-objects/vehicle-plate.js'
