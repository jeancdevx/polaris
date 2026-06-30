import type { RfidValidationResult } from '@polaris/domain'

import { ReservationSessionRepository } from './repositories/reservation-session.repository.js'
import { RfidLookupRepository } from './repositories/rfid-lookup.repository.js'

import type { RfidScanEvent } from './iot-event.js'
import { GateCommandPublisher } from './publishers/gate-command.publisher.js'
import { KafkaRfidPublisher } from './publishers/kafka-rfid.publisher.js'
import type { RfidValidatorEnv } from './read-env.js'

export type RfidValidatorResponse = Readonly<{
  valid: boolean
  reason?: string
  userId?: string
  reservationId?: string
  parkingSpotId?: string
  userType?: string
  lookupSource?: 'dynamodb' | 'rds'
  gateCommandsPublished: boolean
  kafkaPublished: boolean
}>

export type ValidateRfidScanDependencies = Readonly<{
  env: RfidValidatorEnv
  rfidLookup: RfidLookupRepository
  reservationSessions: ReservationSessionRepository
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

  if (scan.readerLocation === 'entry') {
    return validateEntry(scan, deps, lookup.tag.userId.value, lookup.source)
  }

  return validateExit(scan, deps, lookup.tag.userId.value, lookup.source)
}

const validateEntry = async (
  scan: RfidScanEvent,
  deps: ValidateRfidScanDependencies,
  userId: string,
  lookupSource: 'dynamodb' | 'rds'
): Promise<RfidValidatorResponse> => {
  const session = await deps.reservationSessions.findActiveForEntry(
    userId,
    scan.occurredAt
  )

  if (!session) {
    return finalizeValidation(scan, deps, {
      valid: false,
      reason: 'no_active_reservation',
      userId,
      lookupSource
    })
  }

  return finalizeValidation(scan, deps, {
    valid: true,
    userId,
    reservationId: session.reservation.reservationId.value,
    parkingSpotId: session.parkingSpotId,
    userType: 'registered',
    lookupSource
  })
}

const validateExit = async (
  scan: RfidScanEvent,
  deps: ValidateRfidScanDependencies,
  userId: string,
  lookupSource: 'dynamodb' | 'rds'
): Promise<RfidValidatorResponse> => {
  const session = await deps.reservationSessions.findCheckedInForExit(userId)

  if (!session) {
    return finalizeValidation(scan, deps, {
      valid: false,
      reason: 'no_active_session',
      userId,
      lookupSource
    })
  }

  return finalizeValidation(scan, deps, {
    valid: true,
    userId,
    reservationId: session.reservation.reservationId.value,
    parkingSpotId: session.parkingSpotId,
    userType: 'registered',
    lookupSource
  })
}

const finalizeValidation = async (
  scan: RfidScanEvent,
  deps: ValidateRfidScanDependencies,
  result: RfidValidationResult & {
    lookupSource?: 'dynamodb' | 'rds'
  }
): Promise<RfidValidatorResponse> => {
  await deps.kafkaPublisher.publishValidation({ scan, result })

  const gateCommandsPublished = result.valid
    ? await deps.gateCommands.publishAllowed({
        scan,
        parkingSpotId: result.parkingSpotId
      })
    : await deps.gateCommands.publishDenied({ scan })

  return {
    valid: result.valid,
    reason: result.reason,
    userId: result.userId,
    reservationId: result.reservationId,
    parkingSpotId: result.parkingSpotId,
    userType: result.userType,
    lookupSource: result.lookupSource,
    gateCommandsPublished,
    kafkaPublished: true
  }
}
