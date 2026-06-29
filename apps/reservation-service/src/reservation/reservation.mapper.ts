import type { ReservationRow } from '@polaris/database'
import type { Reservation } from '@polaris/domain'
import type { Reservation as ReservationDto } from '@polaris/shared-types'

export const mapReservationRow = (row: ReservationRow): ReservationDto => ({
  reservationId: row.reservationId,
  userId: row.userId,
  parkingSpotId: row.parkingSpotId,
  status: row.status,
  reservationDate: row.reservationDate.toISOString(),
  createdAt: row.createdAt.toISOString(),
  expiresAt: row.expiresAt.toISOString(),
  checkedInAt: row.checkedInAt?.toISOString(),
  checkedOutAt: row.checkedOutAt?.toISOString(),
  cancelledAt: row.cancelledAt?.toISOString(),
  expiredAt: row.expiredAt?.toISOString()
})

export const mapDomainReservationToRow = (
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
