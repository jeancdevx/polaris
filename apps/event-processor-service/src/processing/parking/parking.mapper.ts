import type { ParkingSpotRow, ReservationRow } from '@polaris/database'
import {
  createReservationId,
  createSpotId,
  createUserId,
  restoreParkingSpot,
  restoreReservation,
  type ParkingSpot,
  type Reservation
} from '@polaris/domain'
import type { ParkingSpotStatus } from '@polaris/shared-types'

export const mapParkingSpotRow = (row: ParkingSpotRow): ParkingSpot => {
  const spotId = createSpotId(row.spotId)

  return restoreParkingSpot({
    spotId,
    zone: spotId.zone,
    status: row.status,
    reservationId: row.reservationId
      ? createReservationId(row.reservationId)
      : undefined,
    userId: row.userId ? createUserId(row.userId) : undefined,
    occupiedSince: row.occupiedSince
  })
}

export const mapReservationRow = (row: ReservationRow): Reservation =>
  restoreReservation({
    reservationId: createReservationId(row.reservationId),
    userId: createUserId(row.userId),
    parkingSpotId: createSpotId(row.parkingSpotId),
    status: row.status,
    reservationDate: row.reservationDate,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    checkedInAt: row.checkedInAt,
    checkedOutAt: row.checkedOutAt,
    cancelledAt: row.cancelledAt,
    expiredAt: row.expiredAt
  })

export type ParkingSpotDbUpdate = Partial<{
  status: ParkingSpotStatus
  reservationId: string | null
  userId: string | null
  occupiedSince: Date | null
  updatedAt: Date
}>

export const mapParkingSpotToDbUpdate = (
  spot: ParkingSpot
): ParkingSpotDbUpdate => {
  const updatedAt = new Date()

  if (spot.status === 'free') {
    return {
      status: 'free',
      reservationId: null,
      userId: null,
      occupiedSince: null,
      updatedAt
    }
  }

  return {
    status: spot.status,
    reservationId: spot.reservationId?.value,
    userId: spot.userId?.value,
    occupiedSince: spot.occupiedSince,
    updatedAt
  }
}

export const mapParkingSpotToRow = (spot: ParkingSpot): ParkingSpotRow => ({
  spotId: spot.spotId.value,
  zone: spot.zone,
  status: spot.status,
  reservationId: spot.reservationId?.value,
  userId: spot.userId?.value,
  occupiedSince: spot.occupiedSince,
  updatedAt: new Date()
})

export const mapReservationToRow = (
  reservation: Reservation
): ReservationRow => ({
  reservationId: reservation.reservationId.value,
  userId: reservation.userId.value,
  parkingSpotId: reservation.parkingSpotId.value,
  status: reservation.status,
  reservationDate: reservation.reservationDate,
  expiresAt: reservation.expiresAt,
  createdAt: reservation.createdAt,
  checkedInAt: reservation.checkedInAt,
  checkedOutAt: reservation.checkedOutAt,
  cancelledAt: reservation.cancelledAt,
  expiredAt: reservation.expiredAt
})
