import type { ReservationStatus } from '@polaris/shared-types'

import { businessRuleViolation } from '../errors/domain-error.js'

import type { ReservationId, UserId } from '../value-objects/entity-id.js'
import type { SpotId } from '../value-objects/spot-id.js'

export type Reservation = Readonly<{
  reservationId: ReservationId
  userId: UserId
  parkingSpotId: SpotId
  status: ReservationStatus
  reservationDate: Date
  createdAt: Date
  expiresAt: Date
  checkedInAt?: Date
  checkedOutAt?: Date
  cancelledAt?: Date
  expiredAt?: Date
}>

export type CreateReservationInput = {
  reservationId: ReservationId
  userId: UserId
  parkingSpotId: SpotId
  reservationDate: Date
  expiresAt: Date
  createdAt?: Date
}

export const createReservation = (
  input: CreateReservationInput
): Reservation => {
  if (input.expiresAt <= input.reservationDate) {
    businessRuleViolation(
      'INVALID_EXPIRATION',
      'expiresAt must be after reservationDate'
    )
  }
  return {
    reservationId: input.reservationId,
    userId: input.userId,
    parkingSpotId: input.parkingSpotId,
    status: 'active',
    reservationDate: input.reservationDate,
    createdAt: input.createdAt ?? new Date(),
    expiresAt: input.expiresAt
  }
}

export const restoreReservation = (reservation: Reservation): Reservation => ({
  ...reservation
})

export const isReservationExpired = (
  reservation: Reservation,
  at: Date = new Date()
): boolean => at >= reservation.expiresAt

export const canValidateReservationEntry = (
  reservation: Reservation,
  at: Date = new Date()
): boolean =>
  reservation.status === 'active' && !isReservationExpired(reservation, at)

export const hasOpenReservationSession = (reservation: Reservation): boolean =>
  reservation.status === 'checked_in'

export const checkInReservation = (
  reservation: Reservation,
  at: Date = new Date()
): Reservation => {
  if (!canValidateReservationEntry(reservation, at)) {
    businessRuleViolation(
      'RESERVATION_NOT_VALID_FOR_ENTRY',
      `Reservation ${reservation.reservationId.value} cannot be checked in (status: ${reservation.status})`
    )
  }
  return {
    ...reservation,
    status: 'checked_in',
    checkedInAt: at
  }
}

export const checkOutReservation = (
  reservation: Reservation,
  at: Date = new Date()
): Reservation => {
  if (reservation.status !== 'checked_in') {
    businessRuleViolation(
      'RESERVATION_NOT_CHECKED_IN',
      `Reservation ${reservation.reservationId.value} is not checked in`
    )
  }
  return {
    ...reservation,
    status: 'completed',
    checkedOutAt: at
  }
}

export const cancelReservation = (
  reservation: Reservation,
  at: Date = new Date()
): Reservation => {
  if (reservation.status !== 'active') {
    businessRuleViolation(
      'RESERVATION_NOT_CANCELLABLE',
      `Reservation ${reservation.reservationId.value} cannot be cancelled (status: ${reservation.status})`
    )
  }
  return {
    ...reservation,
    status: 'cancelled',
    cancelledAt: at
  }
}

export const expireReservation = (
  reservation: Reservation,
  at: Date = new Date()
): Reservation => {
  if (reservation.status !== 'active') {
    businessRuleViolation(
      'RESERVATION_NOT_EXPIRABLE',
      `Reservation ${reservation.reservationId.value} cannot be expired (status: ${reservation.status})`
    )
  }
  if (!isReservationExpired(reservation, at)) {
    businessRuleViolation(
      'RESERVATION_NOT_YET_EXPIRED',
      `Reservation ${reservation.reservationId.value} has not reached expiresAt`
    )
  }
  return {
    ...reservation,
    status: 'expired',
    expiredAt: at
  }
}
