import { describe, expect, it, vi } from 'vitest'

import { ParkingCapacityRepository } from './repositories/parking-capacity.repository.js'
import { ParkingSessionRepository } from './repositories/parking-session.repository.js'
import { ReservationSessionRepository } from './repositories/reservation-session.repository.js'
import { RfidLookupRepository } from './repositories/rfid-lookup.repository.js'

import type { RfidScanEvent } from './iot-event.js'
import { GateCommandPublisher } from './publishers/gate-command.publisher.js'
import { KafkaRfidPublisher } from './publishers/kafka-rfid.publisher.js'
import type { RfidValidatorEnv } from './read-env.js'
import {
  validateRfidScan,
  type ValidateRfidScanDependencies
} from './validate-rfid-scan.js'

const baseEnv: RfidValidatorEnv = {
  lookupMode: 'rds',
  gateCommandsEnabled: false,
  entryDisplayDeviceId: 'entry-lcd',
  entryServoDeviceId: 'entry-servo',
  exitServoDeviceId: 'exit-servo',
  kafkaClientId: 'rfid-validator-test'
}

const entryScan: RfidScanEvent = {
  deviceId: 'entry-io-01',
  rfidUid: 'A3:BF:22:01',
  readerLocation: 'entry',
  occurredAt: new Date('2025-06-19T14:00:00.000Z')
}

const tagLookup = {
  source: 'rds' as const,
  tag: {
    userId: { value: 'usr-12345' },
    userType: 'registered',
    vehiclePlate: { value: 'ABC-1234' }
  }
}

const buildDeps = (
  overrides: Partial<ValidateRfidScanDependencies> = {}
): ValidateRfidScanDependencies => ({
  env: baseEnv,
  rfidLookup: {
    findByUid: vi.fn()
  } as unknown as RfidLookupRepository,
  reservationSessions: {
    findActiveForEntry: vi.fn(),
    findCheckedInForExit: vi.fn()
  } as unknown as ReservationSessionRepository,
  parkingSessions: {
    findOpenWalkInByRfidUid: vi.fn(),
    createWalkInSession: vi.fn(),
    closeWalkInSession: vi.fn()
  } as unknown as ParkingSessionRepository,
  parkingCapacity: {
    countFreeSpots: vi.fn()
  } as unknown as ParkingCapacityRepository,
  kafkaPublisher: {
    publishValidation: vi.fn().mockResolvedValue(undefined)
  } as unknown as KafkaRfidPublisher,
  gateCommands: {
    publishAllowed: vi.fn().mockResolvedValue(false),
    publishDenied: vi.fn().mockResolvedValue(false)
  } as unknown as GateCommandPublisher,
  ...overrides
})

describe('validateRfidScan', () => {
  it('denies unknown RFID tags', async () => {
    const deps = buildDeps()
    vi.mocked(deps.rfidLookup.findByUid).mockResolvedValue(null)

    const result = await validateRfidScan(entryScan, deps)

    expect(result.valid).toBe(false)
    expect(result.reason).toBe('rfid_not_found_or_inactive')
    expect(deps.kafkaPublisher.publishValidation).toHaveBeenCalledOnce()
  })

  it('still publishes gate commands when Kafka publish fails', async () => {
    const deps = buildDeps()
    vi.mocked(deps.rfidLookup.findByUid).mockResolvedValue(null)
    vi.mocked(deps.kafkaPublisher.publishValidation).mockRejectedValue(
      new Error('Kafka producer connect timed out')
    )

    const result = await validateRfidScan(entryScan, deps)

    expect(result.valid).toBe(false)
    expect(result.gateCommandsPublished).toBe(false)
    expect(deps.gateCommands.publishDenied).toHaveBeenCalledOnce()
    expect(result.kafkaPublished).toBe(false)
  })

  it('allows entry when RFID and active reservation exist', async () => {
    const deps = buildDeps()
    vi.mocked(deps.rfidLookup.findByUid).mockResolvedValue(tagLookup as never)
    vi.mocked(deps.reservationSessions.findActiveForEntry).mockResolvedValue({
      reservation: {
        reservationId: { value: 'res-001' }
      },
      parkingSpotId: 'spot-03'
    } as never)

    const result = await validateRfidScan(entryScan, deps)

    expect(result.valid).toBe(true)
    expect(result.accessType).toBe('reserved')
    expect(result.reservationId).toBe('res-001')
    expect(result.parkingSpotId).toBe('spot-03')
    expect(deps.gateCommands.publishAllowed).toHaveBeenCalledOnce()
  })

  it('allows walk-in entry when tag is valid and free spots exist', async () => {
    const deps = buildDeps()
    vi.mocked(deps.rfidLookup.findByUid).mockResolvedValue(tagLookup as never)
    vi.mocked(deps.reservationSessions.findActiveForEntry).mockResolvedValue(
      null
    )
    vi.mocked(deps.parkingSessions.findOpenWalkInByRfidUid).mockResolvedValue(
      null
    )
    vi.mocked(deps.parkingCapacity.countFreeSpots).mockResolvedValue(5)
    vi.mocked(deps.parkingSessions.createWalkInSession).mockResolvedValue({
      sessionId: 'ses-walk-001',
      rfidUid: entryScan.rfidUid,
      userId: 'usr-12345',
      vehiclePlate: 'ABC-1234',
      entryAt: entryScan.occurredAt
    })

    const result = await validateRfidScan(entryScan, deps)

    expect(result.valid).toBe(true)
    expect(result.accessType).toBe('walk_in')
    expect(result.sessionId).toBe('ses-walk-001')
    expect(deps.parkingSessions.createWalkInSession).toHaveBeenCalledOnce()
  })

  it('denies walk-in entry when parking is full', async () => {
    const deps = buildDeps()
    vi.mocked(deps.rfidLookup.findByUid).mockResolvedValue(tagLookup as never)
    vi.mocked(deps.reservationSessions.findActiveForEntry).mockResolvedValue(
      null
    )
    vi.mocked(deps.parkingSessions.findOpenWalkInByRfidUid).mockResolvedValue(
      null
    )
    vi.mocked(deps.parkingCapacity.countFreeSpots).mockResolvedValue(0)

    const result = await validateRfidScan(entryScan, deps)

    expect(result.valid).toBe(false)
    expect(result.reason).toBe('parking_full')
  })

  it('denies walk-in entry when an open session already exists', async () => {
    const deps = buildDeps()
    vi.mocked(deps.rfidLookup.findByUid).mockResolvedValue(tagLookup as never)
    vi.mocked(deps.reservationSessions.findActiveForEntry).mockResolvedValue(
      null
    )
    vi.mocked(deps.parkingSessions.findOpenWalkInByRfidUid).mockResolvedValue({
      sessionId: 'ses-open',
      rfidUid: entryScan.rfidUid,
      entryAt: entryScan.occurredAt
    })

    const result = await validateRfidScan(entryScan, deps)

    expect(result.valid).toBe(false)
    expect(result.reason).toBe('session_already_open')
  })

  it('allows walk-in exit and closes the open session', async () => {
    const deps = buildDeps()
    vi.mocked(deps.rfidLookup.findByUid).mockResolvedValue(tagLookup as never)
    vi.mocked(deps.reservationSessions.findCheckedInForExit).mockResolvedValue(
      null
    )
    vi.mocked(deps.parkingSessions.findOpenWalkInByRfidUid).mockResolvedValue({
      sessionId: 'ses-walk-001',
      rfidUid: entryScan.rfidUid,
      entryAt: entryScan.occurredAt
    })

    const exitScan = { ...entryScan, readerLocation: 'exit' as const }
    const result = await validateRfidScan(exitScan, deps)

    expect(result.valid).toBe(true)
    expect(result.accessType).toBe('walk_in')
    expect(result.sessionId).toBe('ses-walk-001')
    expect(deps.parkingSessions.closeWalkInSession).toHaveBeenCalledWith(
      'ses-walk-001',
      exitScan.occurredAt
    )
  })

  it('denies exit without checked-in reservation or open walk-in session', async () => {
    const deps = buildDeps()
    vi.mocked(deps.rfidLookup.findByUid).mockResolvedValue(tagLookup as never)
    vi.mocked(deps.reservationSessions.findCheckedInForExit).mockResolvedValue(
      null
    )
    vi.mocked(deps.parkingSessions.findOpenWalkInByRfidUid).mockResolvedValue(
      null
    )

    const result = await validateRfidScan(
      { ...entryScan, readerLocation: 'exit' },
      deps
    )

    expect(result.valid).toBe(false)
    expect(result.reason).toBe('no_active_session')
  })
})
