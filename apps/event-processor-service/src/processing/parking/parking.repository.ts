import { Injectable } from '@nestjs/common'

import type { ParkingSpotRow, ReservationRow } from '@polaris/database'
import {
  businessRuleViolation,
  checkInReservation,
  checkOutReservation,
  createReservationId,
  createUserId,
  markParkingSpotFree,
  markParkingSpotOccupied,
  type ParkingSpot
} from '@polaris/domain'
import type { ParkingSpotStatus } from '@polaris/shared-types'

import { DatabaseService } from '../infrastructure/database.service.js'
import {
  mapParkingSpotRow,
  mapParkingSpotToDbUpdate,
  mapReservationRow
} from './parking.mapper.js'

@Injectable()
export class ParkingRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getSpot(spotId: string): Promise<ParkingSpotRow | null> {
    const dataSource = await this.databaseService.getDataSource()
    return dataSource.getRepository<ParkingSpotRow>('ParkingSpot').findOne({
      where: { spotId }
    })
  }

  async getReservation(reservationId: string): Promise<ReservationRow | null> {
    const dataSource = await this.databaseService.getDataSource()
    return dataSource.getRepository<ReservationRow>('Reservation').findOne({
      where: { reservationId }
    })
  }

  async applyVehicleEntry(input: {
    parkingSpotId: string
    userId: string
    reservationId?: string
    occurredAt: Date
  }): Promise<{ spot: ParkingSpot; previousStatus: ParkingSpotStatus }> {
    const dataSource = await this.databaseService.getDataSource()

    return dataSource.transaction(async manager => {
      const spotRepository =
        manager.getRepository<ParkingSpotRow>('ParkingSpot')
      const reservationRepository =
        manager.getRepository<ReservationRow>('Reservation')

      const spotRow = await spotRepository.findOne({
        where: { spotId: input.parkingSpotId }
      })

      if (!spotRow) {
        businessRuleViolation(
          'SPOT_NOT_FOUND',
          `Spot ${input.parkingSpotId} does not exist`
        )
      }

      const previousStatus = spotRow.status
      let spot = mapParkingSpotRow(spotRow)
      const user = createUserId(input.userId)
      const reservationId = input.reservationId
        ? createReservationId(input.reservationId)
        : spot.reservationId

      if (input.reservationId) {
        const reservationRow = await reservationRepository.findOne({
          where: { reservationId: input.reservationId }
        })

        if (!reservationRow) {
          businessRuleViolation(
            'RESERVATION_NOT_FOUND',
            `Reservation ${input.reservationId} does not exist`
          )
        }

        const checkedIn = checkInReservation(
          mapReservationRow(reservationRow),
          input.occurredAt
        )

        await reservationRepository.update(
          { reservationId: checkedIn.reservationId.value, status: 'active' },
          {
            status: checkedIn.status,
            checkedInAt: checkedIn.checkedInAt
          }
        )
      }

      spot = markParkingSpotOccupied(
        spot,
        user,
        reservationId,
        input.occurredAt
      )

      await spotRepository.update(
        { spotId: spot.spotId.value },
        mapParkingSpotToDbUpdate(spot) as never
      )

      return { spot, previousStatus }
    })
  }

  async applyVehicleExit(input: {
    parkingSpotId: string
    userId: string
    reservationId?: string
    occurredAt: Date
  }): Promise<{ spot: ParkingSpot; previousStatus: ParkingSpotStatus }> {
    const dataSource = await this.databaseService.getDataSource()

    return dataSource.transaction(async manager => {
      const spotRepository =
        manager.getRepository<ParkingSpotRow>('ParkingSpot')
      const reservationRepository =
        manager.getRepository<ReservationRow>('Reservation')

      const spotRow = await spotRepository.findOne({
        where: { spotId: input.parkingSpotId }
      })

      if (!spotRow) {
        businessRuleViolation(
          'SPOT_NOT_FOUND',
          `Spot ${input.parkingSpotId} does not exist`
        )
      }

      const previousStatus = spotRow.status
      let spot = mapParkingSpotRow(spotRow)

      if (input.reservationId) {
        const reservationRow = await reservationRepository.findOne({
          where: { reservationId: input.reservationId }
        })

        if (!reservationRow) {
          businessRuleViolation(
            'RESERVATION_NOT_FOUND',
            `Reservation ${input.reservationId} does not exist`
          )
        }

        const completed = checkOutReservation(
          mapReservationRow(reservationRow),
          input.occurredAt
        )

        await reservationRepository.update(
          {
            reservationId: completed.reservationId.value,
            status: 'checked_in'
          },
          {
            status: completed.status,
            checkedOutAt: completed.checkedOutAt
          }
        )
      }

      spot = markParkingSpotFree(spot)

      await spotRepository.update(
        { spotId: spot.spotId.value },
        mapParkingSpotToDbUpdate(spot) as never
      )

      return { spot, previousStatus }
    })
  }

  async applyOccupancyChange(input: {
    spotId: string
    status: ParkingSpotStatus
    occurredAt: Date
  }): Promise<{
    spot: ParkingSpot
    previousStatus: ParkingSpotStatus
  } | null> {
    const dataSource = await this.databaseService.getDataSource()

    return dataSource.transaction(async manager => {
      const spotRepository =
        manager.getRepository<ParkingSpotRow>('ParkingSpot')
      const spotRow = await spotRepository.findOne({
        where: { spotId: input.spotId }
      })

      if (!spotRow) {
        businessRuleViolation(
          'SPOT_NOT_FOUND',
          `Spot ${input.spotId} does not exist`
        )
      }

      if (spotRow.status === input.status) {
        return null
      }

      // Empty reserved spots stay reserved (blue). FC-51 "free" must not
      // wipe an active reservation / LED blink.
      if (spotRow.status === 'reserved' && input.status === 'free') {
        return null
      }

      const previousStatus = spotRow.status
      const spot = mapParkingSpotRow(spotRow)
      const nextSpot = applySensorStatus(spot, input.status, input.occurredAt)

      await spotRepository.update(
        { spotId: nextSpot.spotId.value },
        mapParkingSpotToDbUpdate(nextSpot) as never
      )

      return { spot: nextSpot, previousStatus }
    })
  }
}

const applySensorStatus = (
  spot: ParkingSpot,
  status: ParkingSpotStatus,
  at: Date
): ParkingSpot => {
  if (status === 'occupied') {
    if (spot.status === 'reserved' && spot.userId) {
      return markParkingSpotOccupied(spot, spot.userId, spot.reservationId, at)
    }

    if (spot.status === 'free') {
      return {
        ...spot,
        status: 'occupied',
        occupiedSince: at
      }
    }
  }

  if (status === 'free') {
    return markParkingSpotFree(spot)
  }

  if (status === 'reserved') {
    businessRuleViolation(
      'INVALID_SENSOR_STATUS',
      'sensor.occupancy cannot set status to reserved'
    )
  }

  businessRuleViolation(
    'INVALID_SENSOR_TRANSITION',
    `Spot ${spot.spotId.value} cannot transition to ${status} from ${spot.status}`
  )
}
