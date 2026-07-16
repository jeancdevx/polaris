import {
  createDataSourceAsync,
  enqueueOutboxEvent,
  outboxPayload,
  type ParkingSpotRow,
  type ReservationRow
} from '@polaris/database'
import {
  createReservationCancelledEvent,
  createReservationId,
  createSpotId,
  createUserId,
  restoreReservation,
  type Reservation
} from '@polaris/domain'

import { mapDomainReservationToRow } from '../reservation.mapper.js'

export class ExpiredReservationRepository {
  async findExpiredActive(at: Date): Promise<Reservation[]> {
    const dataSource = await createDataSourceAsync()
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
    const dataSource = await createDataSourceAsync()
    await dataSource.initialize()

    try {
      return dataSource.transaction(async manager => {
        const reservationRepository =
          manager.getRepository<ReservationRow>('Reservation')
        const spotRepository =
          manager.getRepository<ParkingSpotRow>('ParkingSpot')
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

        await spotRepository.update(
          {
            spotId: row.parkingSpotId,
            status: 'reserved',
            reservationId: row.reservationId
          },
          {
            status: 'free',
            reservationId: undefined,
            userId: undefined,
            occupiedSince: undefined
          }
        )

        const event = createReservationCancelledEvent({
          reservationId: row.reservationId,
          userId: row.userId,
          parkingSpotId: row.parkingSpotId,
          reason: 'expired',
          occurredAt: row.expiredAt
        })
        await enqueueOutboxEvent(manager, {
          topic: event.eventName,
          partitionKey: event.aggregateId,
          payload: outboxPayload(event)
        })

        return row
      })
    } finally {
      await dataSource.destroy()
    }
  }
}
