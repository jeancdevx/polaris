import { ConflictException } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import {
  KafkaContainer,
  type StartedKafkaContainer
} from '@testcontainers/kafka'
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
  type ParkingSpotRow
} from '@polaris/database'
import { createKafka } from '@polaris/kafka'
import { KAFKA_TOPICS } from '@polaris/shared-types'
import { sleep } from '@polaris/shared-utils'

import {
  PARKING_SPOT_KEY_PREFIX,
  PARKING_STATS_KEYS
} from './reservation.constants.js'
import { ReservationModule } from './reservation.module.js'
import { ReservationService } from './reservation.service.js'

const kafkaBrokerAddress = (kafka: StartedKafkaContainer): string =>
  `${kafka.getHost()}:${kafka.getMappedPort(9093)}`

const ensureKafkaTopics = async (brokers: string[]): Promise<void> => {
  const kafka = createKafka({
    clientId: 'reservation-integration-test',
    brokers,
    logLevel: 0
  })
  const admin = kafka.admin()

  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      await admin.connect()
      break
    } catch {
      await sleep(500)
    }
  }

  await admin.createTopics({
    topics: [
      {
        topic: KAFKA_TOPICS.RESERVATION_CREATED,
        numPartitions: 1,
        replicationFactor: 1
      },
      {
        topic: KAFKA_TOPICS.RESERVATION_CANCELLED,
        numPartitions: 1,
        replicationFactor: 1
      }
    ]
  })
  await admin.disconnect()
}

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

    for (const row of rows) {
      await redis.hSet(`${PARKING_SPOT_KEY_PREFIX}${row.spotId}`, {
        status: row.status
      })

      if (row.status === 'free') {
        totalAvailable += 1
      }
    }

    await redis.set(PARKING_STATS_KEYS.totalAvailable, totalAvailable)
    await redis.set(PARKING_STATS_KEYS.totalOccupied, 0)
    await redis.set(PARKING_STATS_KEYS.totalReserved, 0)
  } finally {
    await redis.quit()
  }
}

describe('reservation integration', () => {
  let postgres: StartedPostgreSqlContainer
  let redis: StartedRedisContainer
  let kafka: StartedKafkaContainer
  let moduleRef: TestingModule
  let reservationService: ReservationService

  beforeAll(async () => {
    ;[postgres, redis, kafka] = await Promise.all([
      new PostgreSqlContainer('postgres:17.10-alpine')
        .withDatabase('parking_db')
        .withUsername('parking_admin')
        .withPassword('parking_dev')
        .start(),
      new RedisContainer('redis:8.6.4-alpine').start(),
      new KafkaContainer('confluentinc/cp-kafka:7.6.1').withKraft().start()
    ])

    process.env.DATABASE_URL = postgres.getConnectionUri()
    process.env.REDIS_URL = redis.getConnectionUrl()
    process.env.KAFKA_BROKERS = kafkaBrokerAddress(kafka)
    process.env.KAFKA_CLIENT_ID = 'reservation-service-test'
    process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1'

    await runMigrations()
    await runSeed()
    await syncRedisFromRds(process.env.REDIS_URL)
    await ensureKafkaTopics(process.env.KAFKA_BROKERS.split(','))

    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), ReservationModule]
    }).compile()

    reservationService = moduleRef.get(ReservationService)
  }, 240_000)

  afterAll(async () => {
    await moduleRef?.close()
    await Promise.all([postgres.stop(), redis.stop(), kafka.stop()])
  }, 60_000)

  it('creates and cancels a reservation with Redis lock and RDS persistence', async () => {
    const created = await reservationService.create('usr-12345', {
      parkingSpotId: 'spot-07',
      reservationDate: '2025-06-19T14:00:00.000Z'
    })

    expect(created.status).toBe('active')
    expect(created.parkingSpotId).toBe('spot-07')
    expect(created.userId).toBe('usr-12345')

    const dataSource = createDataSource()
    await dataSource.initialize()

    try {
      const reservationRow = await dataSource
        .getRepository('Reservation')
        .findOne({ where: { reservationId: created.reservationId } })

      expect(reservationRow?.status).toBe('active')

      const spotRow = await dataSource
        .getRepository<ParkingSpotRow>('ParkingSpot')
        .findOne({ where: { spotId: 'spot-07' } })

      expect(spotRow?.status).toBe('reserved')
      expect(spotRow?.reservationId).toBe(created.reservationId)
    } finally {
      await dataSource.destroy()
    }

    const redisClient = createClient({ url: process.env.REDIS_URL })
    await redisClient.connect()

    try {
      const spotHash = await redisClient.hGetAll(
        `${PARKING_SPOT_KEY_PREFIX}spot-07`
      )

      expect(spotHash.status).toBe('reserved')
      expect(spotHash.reservationId).toBe(created.reservationId)
    } finally {
      await redisClient.quit()
    }

    const cancelled = await reservationService.cancel(
      'usr-12345',
      created.reservationId
    )

    expect(cancelled.status).toBe('cancelled')
    expect(cancelled.cancelledAt).toBeDefined()

    const redisAfterCancel = createClient({ url: process.env.REDIS_URL })
    await redisAfterCancel.connect()

    try {
      const spotHash = await redisAfterCancel.hGetAll(
        `${PARKING_SPOT_KEY_PREFIX}spot-07`
      )

      expect(spotHash.status).toBe('free')
      expect(spotHash.reservationId).toBeUndefined()
    } finally {
      await redisAfterCancel.quit()
    }
  })

  it('rejects a second reservation on the same spot', async () => {
    await reservationService.create('usr-12345', {
      parkingSpotId: 'spot-03',
      reservationDate: '2025-06-19T15:00:00.000Z'
    })

    await expect(
      reservationService.create('usr-12345', {
        parkingSpotId: 'spot-03',
        reservationDate: '2025-06-19T16:00:00.000Z'
      })
    ).rejects.toBeInstanceOf(ConflictException)
  })
})
