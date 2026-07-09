import { randomUUID } from 'node:crypto'

import {
  KafkaContainer,
  type StartedKafkaContainer
} from '@testcontainers/kafka'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer
} from '@testcontainers/postgresql'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createDataSource,
  runMigrations,
  runSeed,
  type ParkingSpotRow,
  type ReservationRow
} from '@polaris/database'
import {
  createConsumer,
  createKafka,
  disconnectConsumer,
  parseRfidValidationEvent
} from '@polaris/kafka'
import { KAFKA_TOPICS } from '@polaris/shared-types'

import { readRfidValidatorEnv } from './read-env.js'
import {
  createValidateRfidScanDependencies,
  validateRfidScan
} from './validate-rfid-scan.js'

const kafkaBrokerAddress = (kafka: StartedKafkaContainer): string =>
  `${kafka.getHost()}:${kafka.getMappedPort(9093)}`

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, ms)
  })

const ensureKafkaTopics = async (brokers: string[]): Promise<void> => {
  const kafka = createKafka({
    clientId: 'rfid-validator-integration-test',
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
        topic: KAFKA_TOPICS.RFID_VALIDATION,
        numPartitions: 1,
        replicationFactor: 1
      },
      {
        topic: KAFKA_TOPICS.AUDIT_EVENTS,
        numPartitions: 1,
        replicationFactor: 1
      }
    ]
  })
  await admin.disconnect()
}

describe('rfid-validator integration', () => {
  let postgres: StartedPostgreSqlContainer
  let kafka: StartedKafkaContainer

  beforeAll(async () => {
    ;[postgres, kafka] = await Promise.all([
      new PostgreSqlContainer('postgres:17.10-alpine')
        .withDatabase('parking_db')
        .withUsername('parking_admin')
        .withPassword('parking_dev')
        .start(),
      new KafkaContainer('confluentinc/cp-kafka:7.6.1').withKraft().start()
    ])

    process.env.DATABASE_URL = postgres.getConnectionUri()
    process.env.KAFKA_BROKERS = kafkaBrokerAddress(kafka)
    process.env.KAFKA_CLIENT_ID = 'rfid-validator-integration'
    process.env.KAFKA_AUTH_MODE = 'plain'
    process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1'
    process.env.RFID_LOOKUP_MODE = 'rds'
    process.env.GATE_COMMANDS_ENABLED = 'false'

    await runMigrations()
    await runSeed()
    await ensureKafkaTopics(process.env.KAFKA_BROKERS.split(','))

    const dataSource = createDataSource()
    await dataSource.initialize()

    try {
      const reservationDate = new Date('2025-06-19T14:00:00.000Z')
      const expiresAt = new Date('2025-06-19T15:00:00.000Z')

      await dataSource.getRepository<ReservationRow>('Reservation').save({
        reservationId: 'res-rfid-001',
        userId: 'usr-12345',
        parkingSpotId: 'spot-03',
        status: 'active',
        reservationDate,
        expiresAt,
        createdAt: reservationDate
      })

      await dataSource.getRepository<ParkingSpotRow>('ParkingSpot').update(
        { spotId: 'spot-03' },
        {
          status: 'reserved',
          userId: 'usr-12345',
          reservationId: 'res-rfid-001'
        }
      )
    } finally {
      await dataSource.destroy()
    }
  }, 240_000)

  afterAll(async () => {
    await Promise.all([postgres.stop(), kafka.stop()])
  }, 60_000)

  it('validates entry RFID and publishes rfid.validation to Kafka', async () => {
    const brokers = process.env.KAFKA_BROKERS?.split(',') ?? []
    const kafkaClient = createKafka({
      clientId: 'rfid-validator-integration-consumer',
      brokers,
      logLevel: 0
    })
    const consumer = await createConsumer(
      `rfid-validator-${randomUUID()}`,
      kafkaClient
    )
    const validationEvents: ReturnType<typeof parseRfidValidationEvent>[] = []

    try {
      const joined = new Promise<void>(resolve => {
        consumer.on(consumer.events.GROUP_JOIN, () => {
          resolve()
        })
      })

      await consumer.subscribe({
        topics: [KAFKA_TOPICS.RFID_VALIDATION],
        fromBeginning: true
      })

      await consumer.run({
        eachMessage: async payload => {
          const raw = JSON.parse(
            payload.message.value?.toString('utf8') ?? '{}'
          )
          validationEvents.push(parseRfidValidationEvent(raw))
        }
      })

      await joined
      await sleep(250)

      const deps = createValidateRfidScanDependencies(readRfidValidatorEnv())
      const result = await validateRfidScan(
        {
          deviceId: 'entry-io-01',
          rfidUid: 'A3:BF:22:01',
          readerLocation: 'entry',
          occurredAt: new Date('2025-06-19T14:05:00.000Z')
        },
        deps
      )

      expect(result.valid).toBe(true)
      expect(result.reservationId).toBe('res-rfid-001')
      expect(result.parkingSpotId).toBe('spot-03')

      await expect
        .poll(() => validationEvents.length, { timeout: 15_000 })
        .toBe(1)

      expect(validationEvents[0]).toMatchObject({
        eventName: KAFKA_TOPICS.RFID_VALIDATION,
        rfidUid: 'A3:BF:22:01',
        valid: true,
        reservationId: 'res-rfid-001',
        parkingSpotId: 'spot-03'
      })

      await deps.kafkaPublisher.disconnect()
    } finally {
      await disconnectConsumer(consumer)
    }
  }, 60_000)
})
