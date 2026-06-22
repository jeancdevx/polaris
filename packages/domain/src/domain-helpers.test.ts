import { describe, expect, it } from 'vitest'

import { createEmail } from './value-objects/email.js'
import { createReservationId, createUserId } from './value-objects/entity-id.js'
import { createRfidUid } from './value-objects/rfid-uid.js'
import { createSpotId } from './value-objects/spot-id.js'
import { createVehiclePlate } from './value-objects/vehicle-plate.js'

import {
  activateRfidTag,
  createFreeParkingSpot,
  createReservation,
  createReservationCheckedInEvent,
  createReservationCheckedOutEvent,
  createRfidTag,
  createUser,
  emailEquals,
  emailToString,
  restoreParkingSpot,
  restoreReservation,
  restoreRfidTag,
  restoreUser,
  rfidUidToString,
  spotIdEquals,
  spotIdToString,
  vehiclePlateToString
} from './index.js'

describe('restore helpers and value object utilities', () => {
  it('restores entities from snapshots', () => {
    const spotId = createSpotId('spot-01')
    const userId = createUserId('usr-12345')
    const reservationId = createReservationId('res-001')

    const spot = restoreParkingSpot({
      ...createFreeParkingSpot(spotId),
      status: 'occupied',
      userId,
      reservationId,
      occupiedSince: new Date('2025-06-19T10:00:00.000Z')
    })
    expect(spot.status).toBe('occupied')

    const reservation = restoreReservation(
      createReservation({
        reservationId,
        userId,
        parkingSpotId: spotId,
        reservationDate: new Date('2025-06-19T10:00:00.000Z'),
        expiresAt: new Date('2025-06-19T12:00:00.000Z'),
        createdAt: new Date('2025-06-19T09:00:00.000Z')
      })
    )
    expect(reservation.status).toBe('active')

    const user = restoreUser(
      createUser({
        userId,
        name: 'Juan',
        email: createEmail('juan@example.com'),
        vehiclePlate: createVehiclePlate('ABC-1234'),
        rfidUid: createRfidUid('A1:B2:C3:D4')
      })
    )
    expect(user.name).toBe('Juan')

    const tag = activateRfidTag(
      restoreRfidTag(
        createRfidTag({
          rfidUid: createRfidUid('A1:B2:C3:D4'),
          userId,
          vehiclePlate: createVehiclePlate('ABC-1234')
        })
      )
    )
    expect(tag.isActive).toBe(true)
  })

  it('exposes value object helpers', () => {
    const email = createEmail('a@b.com')
    const plate = createVehiclePlate('ABC-1234')
    const uid = createRfidUid('A1:B2:C3:D4')
    const spot = createSpotId('spot-02')

    expect(emailToString(email)).toBe('a@b.com')
    expect(vehiclePlateToString(plate)).toBe('ABC-1234')
    expect(rfidUidToString(uid)).toBe('A1:B2:C3:D4')
    expect(spotIdToString(spot)).toBe('spot-02')
    expect(emailEquals(email, createEmail('a@b.com'))).toBe(true)
    expect(spotIdEquals(spot, createSpotId('spot-02'))).toBe(true)
  })

  it('creates reservation lifecycle events', () => {
    const checkedIn = createReservationCheckedInEvent({
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03'
    })
    const checkedOut = createReservationCheckedOutEvent({
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03'
    })
    expect(checkedIn.eventName).toBe('reservation.checked_in')
    expect(checkedOut.payload.parkingSpotId).toBe('spot-03')
  })
})
