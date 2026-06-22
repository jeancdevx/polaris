import { describe, expect, it } from 'vitest'

import { isBusinessRuleViolationError } from '../errors/domain-error.js'

import {
  createReservationId,
  createUserId
} from '../value-objects/entity-id.js'
import { createSpotId } from '../value-objects/spot-id.js'

import {
  canReserveParkingSpot,
  createFreeParkingSpot,
  markParkingSpotFree,
  markParkingSpotOccupied,
  releaseParkingSpotReservation,
  reserveParkingSpot
} from './parking-spot.js'

const userId = createUserId('usr-12345')
const reservationId = createReservationId('res-001')
const spotId = createSpotId('spot-03')

const expectBusinessRuleViolation = (action: () => void): void => {
  try {
    action()
    expect.fail('expected business rule violation')
  } catch (error) {
    expect(isBusinessRuleViolationError(error)).toBe(true)
  }
}

describe('ParkingSpot', () => {
  it('reserves a free spot', () => {
    const spot = createFreeParkingSpot(spotId)
    const reserved = reserveParkingSpot(spot, reservationId, userId)
    expect(reserved.status).toBe('reserved')
    expect(reserved.reservationId?.value).toBe('res-001')
    expect(canReserveParkingSpot(spot)).toBe(true)
    expect(canReserveParkingSpot(reserved)).toBe(false)
  })

  it('marks a reserved spot as occupied on check-in', () => {
    const reserved = reserveParkingSpot(
      createFreeParkingSpot(spotId),
      reservationId,
      userId
    )
    const occupied = markParkingSpotOccupied(reserved, userId, reservationId)
    expect(occupied.status).toBe('occupied')
    expect(occupied.occupiedSince).toBeInstanceOf(Date)
  })

  it('frees an occupied spot', () => {
    const occupied = markParkingSpotOccupied(
      reserveParkingSpot(createFreeParkingSpot(spotId), reservationId, userId),
      userId,
      reservationId
    )
    const free = markParkingSpotFree(occupied)
    expect(free.status).toBe('free')
    expect(free.userId).toBeUndefined()
  })

  it('rejects reserving an occupied spot', () => {
    const occupied = markParkingSpotOccupied(
      createFreeParkingSpot(spotId),
      userId
    )
    expectBusinessRuleViolation(() =>
      reserveParkingSpot(occupied, reservationId, userId)
    )
  })

  it('releases a reservation', () => {
    const free = releaseParkingSpotReservation(
      reserveParkingSpot(createFreeParkingSpot(spotId), reservationId, userId)
    )
    expect(free.status).toBe('free')
  })
})
