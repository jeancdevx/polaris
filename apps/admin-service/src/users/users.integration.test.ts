import { ConfigModule } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer
} from '@testcontainers/postgresql'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  createDataSource,
  runMigrations,
  runSeed,
  type ReservationRow
} from '@polaris/database'

import { DatabaseModule } from '../infrastructure/database.module.js'
import { CognitoAdminService } from './cognito-admin.service.js'
import { releasedRfidUidForUser } from './release-rfid-uid.js'
import { RfidValidationStore } from './rfid-validation.store.js'
import { usersConfig } from './users.config.js'
import { UsersModule } from './users.module.js'
import { UsersService } from './users.service.js'

describe('users integration', () => {
  let postgres: StartedPostgreSqlContainer
  let moduleRef: TestingModule
  let usersService: UsersService

  beforeAll(async () => {
    postgres = await new PostgreSqlContainer('postgres:17.10-alpine')
      .withDatabase('parking_db')
      .withUsername('parking_admin')
      .withPassword('parking_dev')
      .start()

    process.env.DATABASE_URL = postgres.getConnectionUri()

    await runMigrations()
    await runSeed()

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ConfigModule.forFeature(usersConfig),
        DatabaseModule,
        UsersModule
      ]
    })
      .overrideProvider(CognitoAdminService)
      .useValue({
        provisionUser: vi.fn(),
        disableUser: vi.fn(),
        deleteUser: vi.fn()
      })
      .overrideProvider(RfidValidationStore)
      .useValue({
        putActiveRecord: vi.fn(),
        setActive: vi.fn()
      })
      .compile()

    usersService = moduleRef.get(UsersService)
  }, 120_000)

  afterAll(async () => {
    await moduleRef?.close()
    await postgres.stop()
  }, 60_000)

  it('creates, lists, updates and deactivates an admin-managed user', async () => {
    const created = await usersService.create({
      name: 'Integration User',
      email: 'integration.user@example.com',
      vehiclePlate: 'INT-001',
      rfidUid: 'B1:C2:D3:E4',
      userType: 'registered',
      role: 'user',
      password: 'PolarisTest1!'
    })

    expect(created.userId).toMatch(/^usr-[a-f0-9]{16}$/)
    expect(created.isActive).toBe(true)

    const listed = await usersService.list(false)
    expect(listed.users.some(user => user.userId === created.userId)).toBe(true)

    const updated = await usersService.update(created.userId, {
      name: 'Integration User Updated',
      vehiclePlate: 'INT-002'
    })

    expect(updated.name).toBe('Integration User Updated')
    expect(updated.vehiclePlate).toBe('INT-002')

    const dataSource = createDataSource()
    await dataSource.initialize()

    let reservationId = 'res-admin-int-001'

    try {
      await dataSource.getRepository<ReservationRow>('Reservation').save({
        reservationId,
        userId: created.userId,
        parkingSpotId: 'spot-01',
        status: 'active',
        reservationDate: new Date('2025-06-19T14:00:00.000Z'),
        expiresAt: new Date('2025-06-19T16:00:00.000Z'),
        createdAt: new Date('2025-06-19T14:00:00.000Z')
      })

      await dataSource.getRepository('ParkingSpot').update(
        { spotId: 'spot-01' },
        {
          status: 'reserved',
          userId: created.userId,
          reservationId
        }
      )
    } finally {
      await dataSource.destroy()
    }

    const deactivated = await usersService.remove(created.userId)

    expect(deactivated.isActive).toBe(false)

    const dataSourceAfter = createDataSource()
    await dataSourceAfter.initialize()

    try {
      const reservation = await dataSourceAfter
        .getRepository<ReservationRow>('Reservation')
        .findOne({ where: { reservationId } })

      expect(reservation?.status).toBe('cancelled')

      const spot = await dataSourceAfter
        .getRepository('ParkingSpot')
        .findOne({ where: { spotId: 'spot-01' } })

      expect(spot?.status).toBe('free')
    } finally {
      await dataSourceAfter.destroy()
    }
  })

  it('registers a new user reusing an active visitor RFID', async () => {
    const created = await usersService.create({
      name: 'Jeancarlo Morales',
      email: 'reclaim.visitor@example.com',
      vehiclePlate: 'XYZ-123',
      rfidUid: 'D2:D7:1B:F1',
      userType: 'registered',
      role: 'user',
      password: 'PolarisTest1!'
    })

    expect(created.rfidUid).toBe('D2:D7:1B:F1')
    expect(created.userType).toBe('registered')

    const dataSource = createDataSource()
    await dataSource.initialize()

    try {
      const visitor = await dataSource
        .getRepository('User')
        .findOne({ where: { userId: 'usr-card04' } })

      expect(visitor?.isActive).toBe(false)
      expect(visitor?.rfidUid).toBe(releasedRfidUidForUser('usr-card04'))

      const rfidTag = await dataSource
        .getRepository('RfidTag')
        .findOne({ where: { rfidUid: 'D2:D7:1B:F1' } })

      expect(rfidTag).toMatchObject({
        userId: created.userId,
        userType: 'registered',
        isActive: true
      })
    } finally {
      await dataSource.destroy()
    }
  })
})
