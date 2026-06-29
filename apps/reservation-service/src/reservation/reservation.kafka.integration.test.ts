import { randomUUID } from 'node:crypto'

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
import {
  createConsumer,
  createKafka,
  disconnectConsumer,
  parseReservationCancelledEvent,
  parseReservationCreatedEvent
} from '@polaris/kafka'
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

describe('reservation kafka integration', () => {
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

  it('publishes reservation.created and reservation.cancelled to Kafka', async () => {
    const brokers = process.env.KAFKA_BROKERS?.split(',') ?? []
    const kafkaClient = createKafka({
      clientId: 'reservation-kafka-consumer-test',
      brokers,
      logLevel: 0
    })
    const groupId = `reservation-kafka-${randomUUID()}`
    const consumer = await createConsumer(groupId, kafkaClient)

    const createdEvents: ReturnType<typeof parseReservationCreatedEvent>[] = []
    const cancelledEvents: ReturnType<typeof parseReservationCancelledEvent>[] =
      []

    try {
      const joined = new Promise<void>(resolve => {
        consumer.on(consumer.events.GROUP_JOIN, () => {
          resolve()
        })
      })

      await consumer.subscribe({
        topics: [
          KAFKA_TOPICS.RESERVATION_CREATED,
          KAFKA_TOPICS.RESERVATION_CANCELLED
        ],
        fromBeginning: true
      })

      await consumer.run({
        eachMessage: async payload => {
          const raw = JSON.parse(
            payload.message.value?.toString('utf8') ?? '{}'
          )

          if (payload.topic === KAFKA_TOPICS.RESERVATION_CREATED) {
            createdEvents.push(parseReservationCreatedEvent(raw))
            return
          }

          if (payload.topic === KAFKA_TOPICS.RESERVATION_CANCELLED) {
            cancelledEvents.push(parseReservationCancelledEvent(raw))
          }
        }
      })

      await joined
      await sleep(250)

      const created = await reservationService.create('usr-12345', {
        parkingSpotId: 'spot-08',
        reservationDate: '2025-06-19T14:00:00.000Z'
      })

      await expect.poll(() => createdEvents.length, { timeout: 15_000 }).toBe(1)

      expect(createdEvents[0]).toMatchObject({
        eventName: KAFKA_TOPICS.RESERVATION_CREATED,
        reservationId: created.reservationId,
        userId: 'usr-12345',
        parkingSpotId: 'spot-08',
        expiresAt: created.expiresAt
      })

      await reservationService.cancel('usr-12345', created.reservationId)

      await expect
        .poll(() => cancelledEvents.length, { timeout: 15_000 })
        .toBe(1)

      expect(cancelledEvents[0]).toMatchObject({
        eventName: KAFKA_TOPICS.RESERVATION_CANCELLED,
        reservationId: created.reservationId,
        userId: 'usr-12345',
        parkingSpotId: 'spot-08',
        reason: 'user_cancelled'
      })
    } finally {
      await disconnectConsumer(consumer)
    }
  })
})
