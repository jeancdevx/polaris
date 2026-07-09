import {
  allSpotIds,
  createEmail,
  createFreeParkingSpot,
  createRfidTag,
  createRfidUid,
  createUser,
  createUserId,
  createVehiclePlate,
  type RfidTag,
  type User
} from '@polaris/domain'

import type {
  ParkingSpotRow,
  RfidTagRow,
  UserRole,
  UserRow
} from '../entities/index.js'

const SEED_TIMESTAMP = new Date('2025-06-19T10:00:00.000Z')

const toUserRow = (user: User, role: UserRole): UserRow => ({
  userId: user.userId.value,
  name: user.name,
  email: user.email.value,
  vehiclePlate: user.vehiclePlate.value,
  rfidUid: user.rfidUid.value,
  userType: user.userType,
  role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: SEED_TIMESTAMP
})

const toRfidTagRow = (tag: RfidTag): RfidTagRow => ({
  rfidUid: tag.rfidUid.value,
  userId: tag.userId.value,
  userType: tag.userType,
  vehiclePlate: tag.vehiclePlate.value,
  isActive: tag.isActive,
  validUntil: tag.validUntil,
  createdAt: tag.createdAt
})

export type SeedData = Readonly<{
  users: UserRow[]
  parkingSpots: ParkingSpotRow[]
  rfidTags: RfidTagRow[]
}>

export const buildSeedData = (): SeedData => {
  const admin = createUser({
    userId: createUserId('usr-admin01'),
    name: 'Admin Polaris',
    email: createEmail('admin@polaris.local'),
    vehiclePlate: createVehiclePlate('ADM-0001'),
    rfidUid: createRfidUid('A1:B2:C3:D4'),
    createdAt: SEED_TIMESTAMP
  })

  const testUser = createUser({
    userId: createUserId('usr-12345'),
    name: 'Juan Perez',
    email: createEmail('juan@example.com'),
    vehiclePlate: createVehiclePlate('ABC-1234'),
    rfidUid: createRfidUid('A3:BF:22:01'),
    createdAt: SEED_TIMESTAMP
  })

  const visitor = createUser({
    userId: createUserId('usr-visitor01'),
    name: 'Visitante Demo',
    email: createEmail('visitor@polaris.local'),
    vehiclePlate: createVehiclePlate('VIS-0001'),
    rfidUid: createRfidUid('B1:CE:33:02'),
    userType: 'visitor',
    createdAt: SEED_TIMESTAMP
  })

  const users = [
    toUserRow(admin, 'admin'),
    toUserRow(testUser, 'user'),
    toUserRow(visitor, 'user')
  ]

  const parkingSpots = allSpotIds().map(spotId => {
    const spot = createFreeParkingSpot(spotId)

    return {
      spotId: spot.spotId.value,
      zone: spot.zone,
      status: spot.status,
      updatedAt: SEED_TIMESTAMP
    }
  })

  const rfidTags = [
    toRfidTagRow(
      createRfidTag({
        rfidUid: admin.rfidUid,
        userId: admin.userId,
        vehiclePlate: admin.vehiclePlate,
        createdAt: SEED_TIMESTAMP
      })
    ),
    toRfidTagRow(
      createRfidTag({
        rfidUid: testUser.rfidUid,
        userId: testUser.userId,
        vehiclePlate: testUser.vehiclePlate,
        createdAt: SEED_TIMESTAMP
      })
    ),
    toRfidTagRow(
      createRfidTag({
        rfidUid: visitor.rfidUid,
        userId: visitor.userId,
        vehiclePlate: visitor.vehiclePlate,
        userType: 'visitor',
        createdAt: SEED_TIMESTAMP
      })
    )
  ]

  return { users, parkingSpots, rfidTags }
}
