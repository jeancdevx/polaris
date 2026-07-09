import { describe, expect, it, vi } from 'vitest'

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

  it('allows entry when RFID and active reservation exist', async () => {
    const deps = buildDeps()
    vi.mocked(deps.rfidLookup.findByUid).mockResolvedValue({
      source: 'rds',
      tag: {
        userId: { value: 'usr-12345' }
      }
    } as never)
    vi.mocked(deps.reservationSessions.findActiveForEntry).mockResolvedValue({
      reservation: {
        reservationId: { value: 'res-001' }
      },
      parkingSpotId: 'spot-03'
    } as never)

    const result = await validateRfidScan(entryScan, deps)

    expect(result.valid).toBe(true)
    expect(result.reservationId).toBe('res-001')
    expect(result.parkingSpotId).toBe('spot-03')
    expect(deps.gateCommands.publishAllowed).toHaveBeenCalledOnce()
  })

  it('denies exit without checked-in session', async () => {
    const deps = buildDeps()
    vi.mocked(deps.rfidLookup.findByUid).mockResolvedValue({
      source: 'rds',
      tag: {
        userId: { value: 'usr-12345' }
      }
    } as never)
    vi.mocked(deps.reservationSessions.findCheckedInForExit).mockResolvedValue(
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
