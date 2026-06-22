import { describe, expect, it } from 'vitest'

import { isInvalidValueError } from '../errors/domain-error.js'

import {
  createReservationId,
  createUserId,
  reservationIdEquals,
  userIdEquals
} from './entity-id.js'
import { createRfidUid, rfidUidToString } from './rfid-uid.js'
import { allSpotIds, createSpotId, spotIdEquals } from './spot-id.js'
import { createVehiclePlate, vehiclePlateToString } from './vehicle-plate.js'

describe('EntityId value objects', () => {
  it('creates valid user and reservation ids', () => {
    expect(createUserId('usr-12345').value).toBe('usr-12345')
    expect(createReservationId('res-abc-01').value).toBe('res-abc-01')
    expect(userIdEquals(createUserId('usr-1'), createUserId('usr-1'))).toBe(
      true
    )
    expect(
      reservationIdEquals(
        createReservationId('res-1'),
        createReservationId('res-1')
      )
    ).toBe(true)
  })

  it('rejects invalid ids', () => {
    try {
      createUserId('bad-id')
      expect.fail('expected invalid user id')
    } catch (error) {
      expect(isInvalidValueError(error)).toBe(true)
    }

    try {
      createReservationId('usr-12345')
      expect.fail('expected invalid reservation id')
    } catch (error) {
      expect(isInvalidValueError(error)).toBe(true)
    }
  })
})

describe('SpotId', () => {
  it('creates spots 01-10 with correct zones', () => {
    expect(createSpotId('spot-01').zone).toBe('a')
    expect(createSpotId('spot-05').zone).toBe('a')
    expect(createSpotId('spot-06').zone).toBe('b')
    expect(createSpotId('spot-10').zone).toBe('b')
    expect(spotIdEquals(createSpotId('spot-02'), createSpotId('spot-02'))).toBe(
      true
    )
  })

  it('lists all parking spots', () => {
    expect(allSpotIds()).toHaveLength(10)
  })

  it('rejects invalid spot ids', () => {
    expect(() => createSpotId('spot-00')).toThrow()
    expect(() => createSpotId('spot-11')).toThrow()
  })
})

describe('VehiclePlate', () => {
  it('normalizes valid plates', () => {
    expect(createVehiclePlate('abc-1234').value).toBe('ABC-1234')
    expect(vehiclePlateToString(createVehiclePlate('ABC-1234'))).toBe(
      'ABC-1234'
    )
  })

  it('rejects invalid plates', () => {
    expect(() => createVehiclePlate('INVALID')).toThrow()
  })
})

describe('RfidUid', () => {
  it('normalizes valid uids', () => {
    expect(createRfidUid('a3:bf:22:01').value).toBe('A3:BF:22:01')
    expect(rfidUidToString(createRfidUid('A1:B2:C3:D4'))).toBe('A1:B2:C3:D4')
  })

  it('rejects invalid uids', () => {
    expect(() => createRfidUid('BAD')).toThrow()
  })
})
