import type { ReservationRow } from '@polaris/database'
import type { Reservation } from '@polaris/domain'

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
