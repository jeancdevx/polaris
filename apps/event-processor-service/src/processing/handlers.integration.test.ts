import { ConfigModule } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer
} from '@testcontainers/postgresql'
import {
  RedisContainer,
  type StartedRedisContainer
} from '@testcontainers/redis'
import { createClient } from 'redis'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createDataSource,
  runMigrations,
  runSeed,
  type ParkingSpotRow,
  type ReservationRow
} from '@polaris/database'
import { KAFKA_TOPICS } from '@polaris/shared-types'

import { SensorOccupancyHandler } from './handlers/sensor-occupancy.handler.js'
import { VehicleEntryHandler } from './handlers/vehicle-entry.handler.js'
import { VehicleExitHandler } from './handlers/vehicle-exit.handler.js'

import { EventProcessorModule } from './event-processor.module.js'
import {
  PARKING_SPOT_KEY_PREFIX,
  PARKING_STATS_KEYS
} from './infrastructure/parking.constants.js'

const syncRedisFromRds = async (redisUrl: string): Promise<void> => {
  const dataSource = createDataSource()
  await dataSource.initialize()

  let rows: ParkingSpotRow[]

  try {
    rows = await dataSource.getRepository<ParkingSpotRow>('ParkingSpot').find({
      order: { spotId: 'ASC' }
    })
  } finally {
    await dataSource.destroy()
  }

  const redis = createClient({ url: redisUrl })
  await redis.connect()

  try {
    let totalAvailable = 0
    let totalOccupied = 0
    let totalReserved = 0

    for (const row of rows) {
      const hash: Record<string, string> = { status: row.status }

      if (row.userId) {
        hash.userId = row.userId
      }

      if (row.reservationId) {
        hash.reservationId = row.reservationId
      }

      if (row.occupiedSince) {
        hash.occupiedSince = String(row.occupiedSince.getTime())
      }

      await redis.hSet(`${PARKING_SPOT_KEY_PREFIX}${row.spotId}`, hash)

      if (row.status === 'free') {
        totalAvailable += 1
      } else if (row.status === 'occupied') {
        totalOccupied += 1
      } else if (row.status === 'reserved') {
        totalReserved += 1
      }
    }

    await redis.set(PARKING_STATS_KEYS.totalAvailable, totalAvailable)
    await redis.set(PARKING_STATS_KEYS.totalOccupied, totalOccupied)
    await redis.set(PARKING_STATS_KEYS.totalReserved, totalReserved)
  } finally {
    await redis.quit()
  }
}

const reserveSpot = async (input: {
  reservationId: string
  parkingSpotId: string
  userId: string
}): Promise<void> => {
  const dataSource = createDataSource()
  await dataSource.initialize()

  try {
    const reservationDate = new Date('2025-06-19T14:00:00.000Z')
    const expiresAt = new Date('2025-06-19T15:00:00.000Z')

    await dataSource.getRepository<ReservationRow>('Reservation').save({
      reservationId: input.reservationId,
      userId: input.userId,
      parkingSpotId: input.parkingSpotId,
      status: 'active',
      reservationDate,
      expiresAt,
      createdAt: reservationDate
    })

    await dataSource.getRepository<ParkingSpotRow>('ParkingSpot').update(
      { spotId: input.parkingSpotId },
      {
        status: 'reserved',
        userId: input.userId,
        reservationId: input.reservationId
      }
    )
  } finally {
    await dataSource.destroy()
  }

  await syncRedisFromRds(process.env.REDIS_URL!)
}

describe('event processor handlers integration', () => {
  let postgres: StartedPostgreSqlContainer
  let redis: StartedRedisContainer
  let moduleRef: TestingModule
  let vehicleEntryHandler: VehicleEntryHandler
  let vehicleExitHandler: VehicleExitHandler
  let sensorOccupancyHandler: SensorOccupancyHandler

  beforeAll(async () => {
    ;[postgres, redis] = await Promise.all([
      new PostgreSqlContainer('postgres:17.10-alpine')
        .withDatabase('parking_db')
        .withUsername('parking_admin')
        .withPassword('parking_dev')
        .start(),
      new RedisContainer('redis:8.6.4-alpine').start()
    ])

    process.env.DATABASE_URL = postgres.getConnectionUri()
    process.env.REDIS_URL = redis.getConnectionUrl()
    process.env.EVENTBRIDGE_ENABLED = 'false'

    await runMigrations()
    await runSeed()
    await syncRedisFromRds(process.env.REDIS_URL)

    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), EventProcessorModule]
    }).compile()

    vehicleEntryHandler = moduleRef.get(VehicleEntryHandler)
    vehicleExitHandler = moduleRef.get(VehicleExitHandler)
    sensorOccupancyHandler = moduleRef.get(SensorOccupancyHandler)
  }, 180_000)

  afterAll(async () => {
    await moduleRef?.close()
    await Promise.all([postgres.stop(), redis.stop()])
  }, 60_000)

  it('processes vehicle entry and exit with RDS and Redis updates', async () => {
    await reserveSpot({
      reservationId: 'res-handler-001',
      parkingSpotId: 'spot-03',
      userId: 'usr-12345'
    })

    const occurredAt = '2025-06-19T14:05:00.000Z'

    await vehicleEntryHandler.handle({
      eventName: KAFKA_TOPICS.VEHICLE_ENTRY,
      aggregateId: 'evt-entry-001',
      occurredAt,
      eventId: 'evt-entry-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      vehiclePlate: 'ABC-123',
      reservationId: 'res-handler-001',
      gate: 'entry'
    })

    const dataSource = createDataSource()
    await dataSource.initialize()

    try {
      const spotRow = await dataSource
        .getRepository<ParkingSpotRow>('ParkingSpot')
        .findOne({ where: { spotId: 'spot-03' } })

      expect(spotRow?.status).toBe('occupied')
      expect(spotRow?.userId).toBe('usr-12345')

      const reservationRow = await dataSource
        .getRepository<ReservationRow>('Reservation')
        .findOne({ where: { reservationId: 'res-handler-001' } })

      expect(reservationRow?.status).toBe('checked_in')
    } finally {
      await dataSource.destroy()
    }

    const redisClient = createClient({ url: process.env.REDIS_URL })
    await redisClient.connect()

    try {
      const spotHash = await redisClient.hGetAll(
        `${PARKING_SPOT_KEY_PREFIX}spot-03`
      )

      expect(spotHash.status).toBe('occupied')
      expect(spotHash.reservationId).toBe('res-handler-001')

      const totalOccupied = await redisClient.get(
        PARKING_STATS_KEYS.totalOccupied
      )
      expect(Number(totalOccupied)).toBe(1)
    } finally {
      await redisClient.quit()
    }

    await vehicleExitHandler.handle({
      eventName: KAFKA_TOPICS.VEHICLE_EXIT,
      aggregateId: 'evt-exit-001',
      occurredAt: '2025-06-19T14:30:00.000Z',
      eventId: 'evt-exit-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      vehiclePlate: 'ABC-123',
      reservationId: 'res-handler-001',
      gate: 'exit'
    })

    const dataSourceAfterExit = createDataSource()
    await dataSourceAfterExit.initialize()

    try {
      const spotRow = await dataSourceAfterExit
        .getRepository<ParkingSpotRow>('ParkingSpot')
        .findOne({ where: { spotId: 'spot-03' } })

      expect(spotRow?.status).toBe('free')
      expect(spotRow?.userId).toBeNull()

      const reservationRow = await dataSourceAfterExit
        .getRepository<ReservationRow>('Reservation')
        .findOne({ where: { reservationId: 'res-handler-001' } })

      expect(reservationRow?.status).toBe('completed')
    } finally {
      await dataSourceAfterExit.destroy()
    }

    const redisAfterExit = createClient({ url: process.env.REDIS_URL })
    await redisAfterExit.connect()

    try {
      const spotHash = await redisAfterExit.hGetAll(
        `${PARKING_SPOT_KEY_PREFIX}spot-03`
      )

      expect(spotHash.status).toBe('free')
      expect(spotHash.userId).toBeUndefined()

      const totalAvailable = await redisAfterExit.get(
        PARKING_STATS_KEYS.totalAvailable
      )
      expect(Number(totalAvailable)).toBe(10)
    } finally {
      await redisAfterExit.quit()
    }
  })

  it('processes sensor occupancy changes on a free spot', async () => {
    const occurredAt = '2025-06-19T15:00:00.000Z'

    await sensorOccupancyHandler.handle({
      eventName: KAFKA_TOPICS.SENSOR_OCCUPANCY,
      aggregateId: 'spot-01',
      occurredAt,
      spotId: 'spot-01',
      status: 'occupied',
      deviceId: 'fc51-spot-01',
      sensorType: 'fc-51'
    })

    const dataSource = createDataSource()
    await dataSource.initialize()

    try {
      const spotRow = await dataSource
        .getRepository<ParkingSpotRow>('ParkingSpot')
        .findOne({ where: { spotId: 'spot-01' } })

      expect(spotRow?.status).toBe('occupied')
    } finally {
      await dataSource.destroy()
    }

    const redisClient = createClient({ url: process.env.REDIS_URL })
    await redisClient.connect()

    try {
      const spotHash = await redisClient.hGetAll(
        `${PARKING_SPOT_KEY_PREFIX}spot-01`
      )

      expect(spotHash.status).toBe('occupied')

      const totalAvailable = await redisClient.get(
        PARKING_STATS_KEYS.totalAvailable
      )
      const totalOccupied = await redisClient.get(
        PARKING_STATS_KEYS.totalOccupied
      )

      expect(Number(totalAvailable)).toBe(9)
      expect(Number(totalOccupied)).toBe(1)
    } finally {
      await redisClient.quit()
    }

    await sensorOccupancyHandler.handle({
      eventName: KAFKA_TOPICS.SENSOR_OCCUPANCY,
      aggregateId: 'spot-01',
      occurredAt: '2025-06-19T15:10:00.000Z',
      spotId: 'spot-01',
      status: 'free',
      deviceId: 'fc51-spot-01',
      sensorType: 'fc-51'
    })

    await dataSource.initialize()

    try {
      const spotRow = await dataSource
        .getRepository<ParkingSpotRow>('ParkingSpot')
        .findOne({ where: { spotId: 'spot-01' } })

      expect(spotRow?.status).toBe('free')
    } finally {
      await dataSource.destroy()
    }
  })
})
