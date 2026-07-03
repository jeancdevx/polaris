import { Injectable } from '@nestjs/common'

import type { ParkingSpotRow, ReservationRow } from '@polaris/database'
import {
  businessRuleViolation,
  createReservationId,
  createSpotId,
  createUserId,
  restoreParkingSpot,
  type Reservation
} from '@polaris/domain'

import { DatabaseService } from './database.service.js'
import { mapDomainReservationToRow } from './reservation.mapper.js'

@Injectable()
export class ReservationRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async insertActiveReservation(
    reservation: Reservation
  ): Promise<ReservationRow> {
    const dataSource = await this.databaseService.getDataSource()

    return dataSource.transaction(async manager => {
      const spotRepository =
        manager.getRepository<ParkingSpotRow>('ParkingSpot')
      const reservationRepository =
        manager.getRepository<ReservationRow>('Reservation')

      const spotRow = await spotRepository.findOne({
        where: { spotId: reservation.parkingSpotId.value }
      })

      if (!spotRow) {
        businessRuleViolation(
          'SPOT_NOT_FOUND',
          `Spot ${reservation.parkingSpotId.value} does not exist`
        )
      }

      const spotId = createSpotId(spotRow.spotId)
      const spot = restoreParkingSpot({
        spotId,
        zone: spotId.zone,
        status: spotRow.status,
        reservationId: spotRow.reservationId
          ? createReservationId(spotRow.reservationId)
          : undefined,
        userId: spotRow.userId ? createUserId(spotRow.userId) : undefined,
        occupiedSince: spotRow.occupiedSince
      })

      if (spot.status !== 'free') {
        businessRuleViolation(
          'SPOT_NOT_AVAILABLE',
          `Spot ${spot.spotId.value} cannot be reserved (status: ${spot.status})`
        )
      }

      const row = mapDomainReservationToRow(reservation)
      await reservationRepository.insert(row)

      const updateResult = await spotRepository.update(
        {
          spotId: reservation.parkingSpotId.value,
          status: 'free'
        },
        {
          status: 'reserved',
          reservationId: reservation.reservationId.value,
          userId: reservation.userId.value,
          occupiedSince: undefined
        }
      )

      if (!updateResult.affected) {
        businessRuleViolation(
          'SPOT_NOT_AVAILABLE',
          `Spot ${reservation.parkingSpotId.value} is not available`
        )
      }

      return row
    })
  }

  async findById(reservationId: string): Promise<ReservationRow | null> {
    const dataSource = await this.databaseService.getDataSource()
    const repository = dataSource.getRepository<ReservationRow>('Reservation')

    return repository.findOne({
      where: { reservationId }
    })
  }

  async persistCancellation(cancelled: Reservation): Promise<ReservationRow> {
    const dataSource = await this.databaseService.getDataSource()

    return dataSource.transaction(async manager => {
      const spotRepository =
        manager.getRepository<ParkingSpotRow>('ParkingSpot')
      const reservationRepository =
        manager.getRepository<ReservationRow>('Reservation')

      const row = mapDomainReservationToRow(cancelled)

      const updateResult = await reservationRepository.update(
        { reservationId: row.reservationId, status: 'active' },
        {
          status: row.status,
          cancelledAt: row.cancelledAt
        }
      )

      if (!updateResult.affected) {
        businessRuleViolation(
          'RESERVATION_NOT_CANCELLABLE',
          `Reservation ${row.reservationId} cannot be cancelled`
        )
      }

      const spotRow = await spotRepository.findOne({
        where: { spotId: row.parkingSpotId }
      })

      if (!spotRow) {
        businessRuleViolation(
          'SPOT_NOT_FOUND',
          `Spot ${row.parkingSpotId} does not exist`
        )
      }

      if (spotRow.status === 'reserved') {
        await spotRepository.update(
          { spotId: row.parkingSpotId },
          {
            status: 'free',
            reservationId: undefined,
            userId: undefined,
            occupiedSince: undefined
          }
        )
      }

      return row
    })
  }
}
