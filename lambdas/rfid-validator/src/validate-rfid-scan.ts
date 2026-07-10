import type { RfidValidationResult } from '@polaris/domain'

import { ParkingCapacityRepository } from './repositories/parking-capacity.repository.js'
import { ParkingSessionRepository } from './repositories/parking-session.repository.js'
import { ReservationSessionRepository } from './repositories/reservation-session.repository.js'
import { RfidLookupRepository } from './repositories/rfid-lookup.repository.js'

import type { RfidScanEvent } from './iot-event.js'
import { GateCommandPublisher } from './publishers/gate-command.publisher.js'
import { KafkaRfidPublisher } from './publishers/kafka-rfid.publisher.js'
import type { RfidValidatorEnv } from './read-env.js'

export type RfidValidatorResponse = Readonly<{
  valid: boolean
  reason?: string
  accessType?: 'reserved' | 'walk_in'
  sessionId?: string
  userId?: string
  reservationId?: string
  parkingSpotId?: string
  userType?: string
  vehiclePlate?: string
  lookupSource?: 'dynamodb' | 'rds'
  gateCommandsPublished: boolean
  kafkaPublished: boolean
}>

export type ValidateRfidScanDependencies = Readonly<{
  env: RfidValidatorEnv
  rfidLookup: RfidLookupRepository
  reservationSessions: ReservationSessionRepository
  parkingSessions: ParkingSessionRepository
  parkingCapacity: ParkingCapacityRepository
  kafkaPublisher: KafkaRfidPublisher
  gateCommands: GateCommandPublisher
}>

export const createValidateRfidScanDependencies = (
  env: RfidValidatorEnv
): ValidateRfidScanDependencies => ({
  env,
  rfidLookup: new RfidLookupRepository({
    lookupMode: env.lookupMode,
    tableName: env.rfidValidationsTableName
  }),
  reservationSessions: new ReservationSessionRepository(),
  parkingSessions: new ParkingSessionRepository(),
  parkingCapacity: new ParkingCapacityRepository(),
  kafkaPublisher: new KafkaRfidPublisher(env.kafkaClientId),
  gateCommands: new GateCommandPublisher(env)
})

export const validateRfidScan = async (
  scan: RfidScanEvent,
  deps: ValidateRfidScanDependencies
): Promise<RfidValidatorResponse> => {
  const lookup = await deps.rfidLookup.findByUid(scan.rfidUid)

  if (!lookup) {
    return finalizeValidation(scan, deps, {
      valid: false,
      reason: 'rfid_not_found_or_inactive'
    })
  }

  const vehiclePlate = lookup.tag.vehiclePlate.value
  const userId = lookup.tag.userId.value
  const userType = lookup.tag.userType

  if (scan.readerLocation === 'entry') {
    return validateEntry(scan, deps, {
      userId,
      userType,
      vehiclePlate,
      lookupSource: lookup.source
    })
  }

  return validateExit(scan, deps, {
    userId,
    userType,
    vehiclePlate,
    lookupSource: lookup.source
  })
}

const validateEntry = async (
  scan: RfidScanEvent,
  deps: ValidateRfidScanDependencies,
  identity: {
    userId: string
    userType: string
    vehiclePlate: string
    lookupSource: 'dynamodb' | 'rds'
  }
): Promise<RfidValidatorResponse> => {
  const reservationSession = await deps.reservationSessions.findActiveForEntry(
    identity.userId,
    scan.occurredAt
  )

  if (reservationSession) {
    return finalizeValidation(scan, deps, {
      valid: true,
      accessType: 'reserved',
      userId: identity.userId,
      reservationId: reservationSession.reservation.reservationId.value,
      parkingSpotId: reservationSession.parkingSpotId,
      userType: identity.userType,
      vehiclePlate: identity.vehiclePlate,
      lookupSource: identity.lookupSource
    })
  }

  const openWalkIn = await deps.parkingSessions.findOpenWalkInByRfidUid(
    scan.rfidUid
  )

  if (openWalkIn) {
    return finalizeValidation(scan, deps, {
      valid: false,
      reason: 'session_already_open',
      userId: identity.userId,
      userType: identity.userType,
      vehiclePlate: identity.vehiclePlate,
      lookupSource: identity.lookupSource
    })
  }

  const freeSpots = await deps.parkingCapacity.countFreeSpots()

  if (freeSpots <= 0) {
    return finalizeValidation(scan, deps, {
      valid: false,
      reason: 'parking_full',
      userId: identity.userId,
      userType: identity.userType,
      vehiclePlate: identity.vehiclePlate,
      lookupSource: identity.lookupSource
    })
  }

  const walkInSession = await deps.parkingSessions.createWalkInSession({
    rfidUid: scan.rfidUid,
    userId: identity.userId,
    vehiclePlate: identity.vehiclePlate,
    entryAt: scan.occurredAt
  })

  return finalizeValidation(scan, deps, {
    valid: true,
    accessType: 'walk_in',
    sessionId: walkInSession.sessionId,
    userId: identity.userId,
    userType: identity.userType,
    vehiclePlate: identity.vehiclePlate,
    lookupSource: identity.lookupSource
  })
}

const validateExit = async (
  scan: RfidScanEvent,
  deps: ValidateRfidScanDependencies,
  identity: {
    userId: string
    userType: string
    vehiclePlate: string
    lookupSource: 'dynamodb' | 'rds'
  }
): Promise<RfidValidatorResponse> => {
  const reservationSession =
    await deps.reservationSessions.findCheckedInForExit(identity.userId)

  if (reservationSession) {
    return finalizeValidation(scan, deps, {
      valid: true,
      accessType: 'reserved',
      userId: identity.userId,
      reservationId: reservationSession.reservation.reservationId.value,
      parkingSpotId: reservationSession.parkingSpotId,
      userType: identity.userType,
      vehiclePlate: identity.vehiclePlate,
      lookupSource: identity.lookupSource
    })
  }

  const openWalkIn = await deps.parkingSessions.findOpenWalkInByRfidUid(
    scan.rfidUid
  )

  if (!openWalkIn) {
    return finalizeValidation(scan, deps, {
      valid: false,
      reason: 'no_active_session',
      userId: identity.userId,
      userType: identity.userType,
      vehiclePlate: identity.vehiclePlate,
      lookupSource: identity.lookupSource
    })
  }

  await deps.parkingSessions.closeWalkInSession(
    openWalkIn.sessionId,
    scan.occurredAt
  )

  return finalizeValidation(scan, deps, {
    valid: true,
    accessType: 'walk_in',
    sessionId: openWalkIn.sessionId,
    userId: identity.userId,
    userType: identity.userType,
    vehiclePlate: identity.vehiclePlate,
    lookupSource: identity.lookupSource
  })
}

const finalizeValidation = async (
  scan: RfidScanEvent,
  deps: ValidateRfidScanDependencies,
  result: RfidValidationResult & {
    lookupSource?: 'dynamodb' | 'rds'
  }
): Promise<RfidValidatorResponse> => {
  const gateCommandsPublished = result.valid
    ? await deps.gateCommands.publishAllowed({
        scan,
        accessType: result.accessType,
        parkingSpotId: result.parkingSpotId
      })
    : await deps.gateCommands.publishDenied({ scan, reason: result.reason })

  let kafkaPublished = false
  try {
    await deps.kafkaPublisher.publishValidation({ scan, result })
    kafkaPublished = true
  } catch {
    // Gate commands are time-critical; Kafka audit can be retried operationally.
  }

  return {
    valid: result.valid,
    reason: result.reason,
    accessType: result.accessType,
    sessionId: result.sessionId,
    userId: result.userId,
    reservationId: result.reservationId,
    parkingSpotId: result.parkingSpotId,
    userType: result.userType,
    vehiclePlate: result.vehiclePlate,
    lookupSource: result.lookupSource,
    gateCommandsPublished,
    kafkaPublished
  }
}
