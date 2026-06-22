import type { ParkingSpotStatus } from '@polaris/shared-types'

import { businessRuleViolation } from '../errors/domain-error.js'

import type { ReservationId, UserId } from '../value-objects/entity-id.js'
import type { SpotId } from '../value-objects/spot-id.js'

export type ParkingSpot = Readonly<{
  spotId: SpotId
  zone: SpotId['zone']
  status: ParkingSpotStatus
  reservationId?: ReservationId
  userId?: UserId
  occupiedSince?: Date
}>

export const createFreeParkingSpot = (spotId: SpotId): ParkingSpot => ({
  spotId,
  zone: spotId.zone,
  status: 'free'
})

export const restoreParkingSpot = (spot: ParkingSpot): ParkingSpot => ({
  ...spot
})

export const canReserveParkingSpot = (spot: ParkingSpot): boolean =>
  spot.status === 'free'

export const reserveParkingSpot = (
  spot: ParkingSpot,
  reservationId: ReservationId,
  userId: UserId
): ParkingSpot => {
  if (!canReserveParkingSpot(spot)) {
    businessRuleViolation(
      'SPOT_NOT_AVAILABLE',
      `Spot ${spot.spotId.value} cannot be reserved (status: ${spot.status})`
    )
  }
  return {
    ...spot,
    status: 'reserved',
    reservationId,
    userId,
    occupiedSince: undefined
  }
}

export const releaseParkingSpotReservation = (
  spot: ParkingSpot
): ParkingSpot => {
  if (spot.status !== 'reserved') {
    businessRuleViolation(
      'SPOT_NOT_RESERVED',
      `Spot ${spot.spotId.value} is not reserved`
    )
  }
  return {
    ...spot,
    status: 'free',
    reservationId: undefined,
    userId: undefined
  }
}

export const markParkingSpotOccupied = (
  spot: ParkingSpot,
  userId: UserId,
  reservationId?: ReservationId,
  at: Date = new Date()
): ParkingSpot => {
  if (spot.status !== 'reserved' && spot.status !== 'free') {
    businessRuleViolation(
      'SPOT_CANNOT_BE_OCCUPIED',
      `Spot ${spot.spotId.value} cannot transition to occupied from ${spot.status}`
    )
  }
  return {
    ...spot,
    status: 'occupied',
    userId,
    reservationId: reservationId ?? spot.reservationId,
    occupiedSince: at
  }
}

export const markParkingSpotFree = (spot: ParkingSpot): ParkingSpot => {
  if (spot.status !== 'occupied' && spot.status !== 'reserved') {
    businessRuleViolation(
      'SPOT_NOT_OCCUPIED',
      `Spot ${spot.spotId.value} is not occupied or reserved`
    )
  }
  return {
    ...spot,
    status: 'free',
    reservationId: undefined,
    userId: undefined,
    occupiedSince: undefined
  }
}
