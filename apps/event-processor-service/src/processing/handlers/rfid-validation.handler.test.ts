import { describe, expect, it, vi } from 'vitest'

import type { RfidValidationEvent } from '@polaris/kafka'

import { RfidValidationHandler } from './rfid-validation.handler.js'
import { VehicleEntryHandler } from './vehicle-entry.handler.js'
import { VehicleExitHandler } from './vehicle-exit.handler.js'
import { WalkInSessionHandler } from './walk-in-session.handler.js'

const baseEvent: RfidValidationEvent = {
  eventName: 'rfid.validation',
  aggregateId: 'A3:BF:22:01',
  occurredAt: '2025-06-19T14:00:00.000Z',
  rfidUid: 'A3:BF:22:01',
  readerLocation: 'entry',
  deviceId: 'entry-io-01',
  valid: true,
  userId: 'usr-12345',
  vehiclePlate: 'ABC-1234'
}

describe('RfidValidationHandler', () => {
  it('routes reserved entry validations to VehicleEntryHandler', async () => {
    const vehicleEntryHandler = {
      handle: vi.fn().mockResolvedValue(undefined)
    } as unknown as VehicleEntryHandler
    const vehicleExitHandler = {
      handle: vi.fn()
    } as unknown as VehicleExitHandler
    const walkInSessionHandler = {
      handle: vi.fn()
    } as unknown as WalkInSessionHandler

    const handler = new RfidValidationHandler(
      vehicleEntryHandler,
      vehicleExitHandler,
      walkInSessionHandler
    )

    await handler.handle({
      ...baseEvent,
      accessType: 'reserved',
      parkingSpotId: 'spot-03',
      reservationId: 'res-001'
    })

    expect(vehicleEntryHandler.handle).toHaveBeenCalledOnce()
    expect(walkInSessionHandler.handle).not.toHaveBeenCalled()
  })

  it('routes walk-in validations to WalkInSessionHandler', async () => {
    const vehicleEntryHandler = {
      handle: vi.fn()
    } as unknown as VehicleEntryHandler
    const vehicleExitHandler = {
      handle: vi.fn()
    } as unknown as VehicleExitHandler
    const walkInSessionHandler = {
      handle: vi.fn().mockResolvedValue(undefined)
    } as unknown as WalkInSessionHandler

    const handler = new RfidValidationHandler(
      vehicleEntryHandler,
      vehicleExitHandler,
      walkInSessionHandler
    )

    await handler.handle({
      ...baseEvent,
      accessType: 'walk_in',
      sessionId: 'ses-walk-001'
    })

    expect(walkInSessionHandler.handle).toHaveBeenCalledOnce()
    expect(vehicleEntryHandler.handle).not.toHaveBeenCalled()
  })

  it('ignores denied validations', async () => {
    const vehicleEntryHandler = {
      handle: vi.fn()
    } as unknown as VehicleEntryHandler
    const vehicleExitHandler = {
      handle: vi.fn()
    } as unknown as VehicleExitHandler
    const walkInSessionHandler = {
      handle: vi.fn()
    } as unknown as WalkInSessionHandler

    const handler = new RfidValidationHandler(
      vehicleEntryHandler,
      vehicleExitHandler,
      walkInSessionHandler
    )

    await handler.handle({
      ...baseEvent,
      valid: false,
      reason: 'parking_full'
    })

    expect(vehicleEntryHandler.handle).not.toHaveBeenCalled()
    expect(walkInSessionHandler.handle).not.toHaveBeenCalled()
  })
})
