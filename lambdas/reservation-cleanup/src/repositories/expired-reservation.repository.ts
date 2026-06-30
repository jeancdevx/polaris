import type { ReservationRow } from '@polaris/database'
import { createDataSource } from '@polaris/database'
import {
  createReservationId,
  createSpotId,
  createUserId,
  restoreReservation,
  type Reservation
} from '@polaris/domain'

import { mapDomainReservationToRow } from '../reservation.mapper.js'

export class ExpiredReservationRepository {
  async findExpiredActive(at: Date): Promise<Reservation[]> {
    const dataSource = createDataSource()
    await dataSource.initialize()

    try {
      const rows = await dataSource
        .getRepository<ReservationRow>('Reservation')
        .createQueryBuilder('reservation')
        .where('reservation.status = :status', { status: 'active' })
        .andWhere('reservation.expires_at < :at', { at })
        .orderBy('reservation.expires_at', 'ASC')
        .getMany()

      return rows.map(row =>
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
      )
    } finally {
      await dataSource.destroy()
    }
  }

  async persistExpiration(expired: Reservation): Promise<ReservationRow> {
    const dataSource = createDataSource()
    await dataSource.initialize()

    try {
      return dataSource.transaction(async manager => {
        const reservationRepository =
          manager.getRepository<ReservationRow>('Reservation')
        const row = mapDomainReservationToRow(expired)

        const updateResult = await reservationRepository.update(
          { reservationId: row.reservationId, status: 'active' },
          {
            status: row.status,
            expiredAt: row.expiredAt
          }
        )

        if (!updateResult.affected) {
          throw new Error(
            `Reservation ${row.reservationId} could not be expired`
          )
        }

        return row
      })
    } finally {
      await dataSource.destroy()
    }
  }
}
