import { ConflictException, Injectable } from '@nestjs/common'
import type { EntityManager } from 'typeorm'

import type {
  ParkingSpotRow,
  ReservationRow,
  RfidTagRow,
  UserRole,
  UserRow
} from '@polaris/database'
import { enqueueOutboxEvent, outboxPayload } from '@polaris/database'
import { createReservationCancelledEvent } from '@polaris/domain'
import type { UserType } from '@polaris/shared-types'

import { DatabaseService } from '../infrastructure/database.service.js'
import { releasedRfidUidForUser } from './release-rfid-uid.js'

export type InsertAdminUserInput = Readonly<{
  userId: string
  name: string
  email: string
  vehiclePlate: string
  rfidUid: string
  userType: UserType
  role: UserRole
  reclaimRfidFromUserId?: string
}>

export type UpdateAdminUserInput = Readonly<{
  name?: string
  vehiclePlate?: string
  userType?: UserType
  role?: UserRole
  isActive?: boolean
}>

export type UserReservationTransitionResult = Readonly<{
  user: UserRow
  cancelledReservations: ReservationRow[]
}>

@Injectable()
export class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(includeInactive: boolean): Promise<UserRow[]> {
    const dataSource = await this.databaseService.getDataSource()
    const repository = dataSource.getRepository<UserRow>('User')

    if (includeInactive) {
      return repository.find({ order: { createdAt: 'DESC' } })
    }

    return repository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' }
    })
  }

  async findById(userId: string): Promise<UserRow | null> {
    const dataSource = await this.databaseService.getDataSource()
    const repository = dataSource.getRepository<UserRow>('User')

    return repository.findOne({ where: { userId } })
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const dataSource = await this.databaseService.getDataSource()
    const repository = dataSource.getRepository<UserRow>('User')

    return repository.findOne({ where: { email } })
  }

  async findByRfidUid(rfidUid: string): Promise<UserRow | null> {
    const dataSource = await this.databaseService.getDataSource()
    const repository = dataSource.getRepository<UserRow>('User')

    return repository.findOne({ where: { rfidUid } })
  }

  async insertUserWithRfidTag(
    input: InsertAdminUserInput
  ): Promise<UserReservationTransitionResult> {
    const dataSource = await this.databaseService.getDataSource()
    const now = new Date()

    return dataSource.transaction(async manager => {
      const cancelledReservations = input.reclaimRfidFromUserId
        ? await this.reclaimVisitorRfidInTransaction(
            manager,
            input.reclaimRfidFromUserId,
            input.rfidUid,
            now
          )
        : []

      const userRepository = manager.getRepository<UserRow>('User')
      const rfidRepository = manager.getRepository<RfidTagRow>('RfidTag')

      const row: UserRow = {
        userId: input.userId,
        name: input.name,
        email: input.email,
        vehiclePlate: input.vehiclePlate,
        rfidUid: input.rfidUid,
        userType: input.userType,
        role: input.role,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }

      await userRepository.insert(row)

      const existingTag = await rfidRepository.findOne({
        where: { rfidUid: input.rfidUid }
      })

      if (existingTag) {
        await rfidRepository.update(
          { rfidUid: input.rfidUid },
          {
            userId: input.userId,
            userType: input.userType,
            vehiclePlate: input.vehiclePlate,
            isActive: true
          }
        )
      } else {
        await rfidRepository.insert({
          rfidUid: input.rfidUid,
          userId: input.userId,
          userType: input.userType,
          vehiclePlate: input.vehiclePlate,
          isActive: true,
          createdAt: now
        })
      }

      return { user: row, cancelledReservations }
    })
  }

  async updateUser(
    userId: string,
    input: UpdateAdminUserInput
  ): Promise<UserReservationTransitionResult | null> {
    const dataSource = await this.databaseService.getDataSource()
    const now = new Date()

    return dataSource.transaction(async manager => {
      const userRepository = manager.getRepository<UserRow>('User')
      const rfidRepository = manager.getRepository<RfidTagRow>('RfidTag')

      const existing = await userRepository.findOne({ where: { userId } })
      if (!existing) {
        return null
      }

      const nextUser: UserRow = {
        ...existing,
        name: input.name ?? existing.name,
        vehiclePlate: input.vehiclePlate ?? existing.vehiclePlate,
        userType: input.userType ?? existing.userType,
        role: input.role ?? existing.role,
        isActive: input.isActive ?? existing.isActive,
        updatedAt: now
      }
      const cancelledReservations =
        existing.isActive && nextUser.isActive === false
          ? await this.cancelActiveReservationsForUser(manager, userId, now)
          : []

      await userRepository.save(nextUser)

      const rfidUpdate: Partial<RfidTagRow> = {
        vehiclePlate: nextUser.vehiclePlate,
        userType: nextUser.userType,
        isActive: nextUser.isActive
      }

      await rfidRepository.update({ rfidUid: existing.rfidUid }, rfidUpdate)

      return { user: nextUser, cancelledReservations }
    })
  }

  async deactivateUser(
    userId: string
  ): Promise<UserReservationTransitionResult | null> {
    const dataSource = await this.databaseService.getDataSource()
    const now = new Date()

    return dataSource.transaction(async manager => {
      const userRepository = manager.getRepository<UserRow>('User')
      const rfidRepository = manager.getRepository<RfidTagRow>('RfidTag')

      const existing = await userRepository.findOne({ where: { userId } })
      if (!existing) {
        return null
      }

      if (!existing.isActive) {
        return { user: existing, cancelledReservations: [] }
      }

      const cancelledReservations = await this.cancelActiveReservationsForUser(
        manager,
        userId,
        now
      )

      const deactivated: UserRow = {
        ...existing,
        isActive: false,
        updatedAt: now
      }

      await userRepository.save(deactivated)
      await rfidRepository.update(
        { rfidUid: existing.rfidUid },
        { isActive: false }
      )

      return { user: deactivated, cancelledReservations }
    })
  }

  private async reclaimVisitorRfidInTransaction(
    manager: EntityManager,
    visitorUserId: string,
    rfidUid: string,
    now: Date
  ): Promise<ReservationRow[]> {
    const userRepository = manager.getRepository<UserRow>('User')
    const visitor = await userRepository.findOne({
      where: { userId: visitorUserId }
    })

    if (!visitor) {
      throw new ConflictException(
        `Visitor user ${visitorUserId} was not found for RFID reclaim`
      )
    }

    if (visitor.userType !== 'visitor') {
      throw new ConflictException(
        `RFID ${rfidUid} is assigned to a non-visitor user`
      )
    }

    if (visitor.rfidUid !== rfidUid) {
      throw new ConflictException(
        `RFID ${rfidUid} does not match visitor ${visitorUserId}`
      )
    }

    const cancelledReservations = await this.cancelActiveReservationsForUser(
      manager,
      visitorUserId,
      now
    )

    await userRepository.update(
      { userId: visitorUserId },
      {
        isActive: false,
        rfidUid: releasedRfidUidForUser(visitorUserId),
        updatedAt: now
      }
    )

    return cancelledReservations
  }

  private async cancelActiveReservationsForUser(
    manager: EntityManager,
    userId: string,
    now: Date
  ): Promise<ReservationRow[]> {
    const reservationRepository =
      manager.getRepository<ReservationRow>('Reservation')
    const spotRepository = manager.getRepository<ParkingSpotRow>('ParkingSpot')

    const activeReservations = await reservationRepository.find({
      where: { userId, status: 'active' }
    })
    const cancelledReservations: ReservationRow[] = []

    for (const reservation of activeReservations) {
      const updateResult = await reservationRepository.update(
        { reservationId: reservation.reservationId, status: 'active' },
        {
          status: 'cancelled',
          cancelledAt: now
        }
      )
      if (!updateResult.affected) {
        continue
      }

      const spot = await spotRepository.findOne({
        where: { spotId: reservation.parkingSpotId }
      })

      if (spot?.status === 'reserved') {
        await spotRepository.update(
          { spotId: reservation.parkingSpotId },
          {
            status: 'free',
            reservationId: undefined,
            userId: undefined,
            occupiedSince: undefined
          }
        )
      }

      const cancelled: ReservationRow = {
        ...reservation,
        status: 'cancelled',
        cancelledAt: now
      }
      const event = createReservationCancelledEvent({
        reservationId: cancelled.reservationId,
        userId: cancelled.userId,
        parkingSpotId: cancelled.parkingSpotId,
        reason: 'admin',
        occurredAt: now
      })
      await enqueueOutboxEvent(manager, {
        topic: event.eventName,
        partitionKey: event.aggregateId,
        payload: outboxPayload(event)
      })
      cancelledReservations.push(cancelled)
    }

    return cancelledReservations
  }
}
