import type { ReservationRow } from '@polaris/database'
import {
  canValidateReservationEntry,
  createReservationId,
  createSpotId,
  createUserId,
  hasOpenReservationSession,
  restoreReservation,
  type Reservation
} from '@polaris/domain'

import { getLambdaDataSource } from '../database/lambda-data-source.js'

export type ReservationSession = Readonly<{
  reservation: Reservation
  parkingSpotId: string
}>

export class ReservationSessionRepository {
  async findActiveForEntry(
    userId: string,
    at: Date
  ): Promise<ReservationSession | null> {
    const reservation = await this.findLatestForUser(userId, 'active')

    if (!reservation || !canValidateReservationEntry(reservation, at)) {
      return null
    }

    return {
      reservation,
      parkingSpotId: reservation.parkingSpotId.value
    }
  }

  async findCheckedInForExit(
    userId: string
  ): Promise<ReservationSession | null> {
    const reservation = await this.findLatestForUser(userId, 'checked_in')

    if (!reservation || !hasOpenReservationSession(reservation)) {
      return null
    }

    return {
      reservation,
      parkingSpotId: reservation.parkingSpotId.value
    }
  }

  private async findLatestForUser(
    userId: string,
    status: ReservationRow['status']
  ): Promise<Reservation | null> {
    const dataSource = await getLambdaDataSource()
    const row = await dataSource
      .getRepository<ReservationRow>('Reservation')
      .findOne({
        where: { userId, status },
        order: { createdAt: 'DESC' }
      })

    if (!row) {
      return null
    }

    return restoreReservation({
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
  }
}
