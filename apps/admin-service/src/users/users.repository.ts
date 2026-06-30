import { Injectable } from '@nestjs/common'
import type {
  ParkingSpotRow,
  ReservationRow,
  RfidTagRow,
  UserRole,
  UserRow
} from '@polaris/database'
import type { UserType } from '@polaris/shared-types'

import { DatabaseService } from '../infrastructure/database.service.js'

export type InsertAdminUserInput = Readonly<{
  userId: string
  name: string
  email: string
  vehiclePlate: string
  rfidUid: string
  userType: UserType
  role: UserRole
}>

export type UpdateAdminUserInput = Readonly<{
  name?: string
  vehiclePlate?: string
  userType?: UserType
  role?: UserRole
  isActive?: boolean
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

  async insertUserWithRfidTag(input: InsertAdminUserInput): Promise<UserRow> {
    const dataSource = await this.databaseService.getDataSource()
    const now = new Date()

    return dataSource.transaction(async manager => {
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
      await rfidRepository.insert({
        rfidUid: input.rfidUid,
        userId: input.userId,
        userType: input.userType,
        vehiclePlate: input.vehiclePlate,
        isActive: true,
        createdAt: now
      })

      return row
    })
  }

  async updateUser(
    userId: string,
    input: UpdateAdminUserInput
  ): Promise<UserRow | null> {
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

      await userRepository.save(nextUser)

      const rfidUpdate: Partial<RfidTagRow> = {
        vehiclePlate: nextUser.vehiclePlate,
        userType: nextUser.userType,
        isActive: nextUser.isActive
      }

      await rfidRepository.update({ rfidUid: existing.rfidUid }, rfidUpdate)

      return nextUser
    })
  }

  async deactivateUser(userId: string): Promise<UserRow | null> {
    const dataSource = await this.databaseService.getDataSource()
    const now = new Date()

    return dataSource.transaction(async manager => {
      const userRepository = manager.getRepository<UserRow>('User')
      const rfidRepository = manager.getRepository<RfidTagRow>('RfidTag')
      const reservationRepository =
        manager.getRepository<ReservationRow>('Reservation')
      const spotRepository =
        manager.getRepository<ParkingSpotRow>('ParkingSpot')

      const existing = await userRepository.findOne({ where: { userId } })
      if (!existing) {
        return null
      }

      if (!existing.isActive) {
        return existing
      }

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

      const activeReservations = await reservationRepository.find({
        where: { userId, status: 'active' }
      })

      for (const reservation of activeReservations) {
        await reservationRepository.update(
          { reservationId: reservation.reservationId, status: 'active' },
          {
            status: 'cancelled',
            cancelledAt: now
          }
        )

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
      }

      return deactivated
    })
  }
}
