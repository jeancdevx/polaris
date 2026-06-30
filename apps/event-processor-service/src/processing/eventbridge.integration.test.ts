import {
  CreateEventBusCommand,
  EventBridgeClient,
  ListTargetsByRuleCommand,
  PutRuleCommand,
  PutTargetsCommand
} from '@aws-sdk/client-eventbridge'
import {
  CreateQueueCommand,
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
  SQSClient
} from '@aws-sdk/client-sqs'
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
import {
  GenericContainer,
  Wait,
  type StartedTestContainer
} from 'testcontainers'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createDataSource,
  runMigrations,
  runSeed,
  type ParkingSpotRow,
  type ReservationRow
} from '@polaris/database'
import {
  EVENTBRIDGE_DEFAULT_BUS_NAME,
  EVENTBRIDGE_SOURCE_EVENT_PROCESSOR
} from '@polaris/eventbridge'
import { KAFKA_TOPICS } from '@polaris/shared-types'
import { sleep } from '@polaris/shared-utils'

import { VehicleEntryHandler } from './handlers/vehicle-entry.handler.js'

import { EventProcessorModule } from './event-processor.module.js'
import {
  PARKING_SPOT_KEY_PREFIX,
  PARKING_STATS_KEYS
} from './infrastructure/parking.constants.js'

const LOCALSTACK_REGION = 'us-east-1'
const RULE_NAME = 'vehicle-entry-audit'
const QUEUE_NAME = 'polaris-audit-test'

const awsTestConfig = (endpoint: string) => ({
  region: LOCALSTACK_REGION,
  endpoint,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
})

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

  const { createClient } = await import('redis')
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

const setupEventBridgeRuleToSqs = async (endpoint: string): Promise<string> => {
  const eventBridge = new EventBridgeClient(awsTestConfig(endpoint))
  const sqs = new SQSClient(awsTestConfig(endpoint))

  await eventBridge.send(
    new CreateEventBusCommand({
      Name: EVENTBRIDGE_DEFAULT_BUS_NAME
    })
  )

  const queue = await sqs.send(
    new CreateQueueCommand({
      QueueName: QUEUE_NAME
    })
  )

  const queueUrl = queue.QueueUrl!

  const queueAttributes = await sqs.send(
    new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ['QueueArn']
    })
  )

  const queueArn = queueAttributes.Attributes?.QueueArn

  if (!queueArn) {
    throw new Error('SQS queue ARN was not returned by LocalStack')
  }

  await eventBridge.send(
    new PutRuleCommand({
      Name: RULE_NAME,
      EventBusName: EVENTBRIDGE_DEFAULT_BUS_NAME,
      EventPattern: JSON.stringify({
        source: [EVENTBRIDGE_SOURCE_EVENT_PROCESSOR],
        'detail-type': [KAFKA_TOPICS.VEHICLE_ENTRY]
      }),
      State: 'ENABLED'
    })
  )

  await eventBridge.send(
    new PutTargetsCommand({
      Rule: RULE_NAME,
      EventBusName: EVENTBRIDGE_DEFAULT_BUS_NAME,
      Targets: [
        {
          Id: 'audit-test-target',
          Arn: queueArn
        }
      ]
    })
  )

  const targets = await eventBridge.send(
    new ListTargetsByRuleCommand({
      Rule: RULE_NAME,
      EventBusName: EVENTBRIDGE_DEFAULT_BUS_NAME
    })
  )

  expect(targets.Targets?.length).toBe(1)

  return queueUrl
}

describe('eventbridge integration', () => {
  let postgres: StartedPostgreSqlContainer
  let redis: StartedRedisContainer
  let localstack: StartedTestContainer
  let moduleRef: TestingModule
  let vehicleEntryHandler: VehicleEntryHandler
  let queueUrl: string
  let awsEndpoint: string

  beforeAll(async () => {
    ;[postgres, redis, localstack] = await Promise.all([
      new PostgreSqlContainer('postgres:17.10-alpine')
        .withDatabase('parking_db')
        .withUsername('parking_admin')
        .withPassword('parking_dev')
        .start(),
      new RedisContainer('redis:8.6.4-alpine').start(),
      new GenericContainer('localstack/localstack:4.4.0')
        .withExposedPorts(4566)
        .withEnvironment({ SERVICES: 'events,sqs' })
        .withWaitStrategy(Wait.forLogMessage(/Ready\./))
        .start()
    ])

    awsEndpoint = `http://${localstack.getHost()}:${localstack.getMappedPort(4566)}`

    process.env.DATABASE_URL = postgres.getConnectionUri()
    process.env.REDIS_URL = redis.getConnectionUrl()
    process.env.AWS_REGION = LOCALSTACK_REGION
    process.env.AWS_ACCESS_KEY_ID = 'test'
    process.env.AWS_SECRET_ACCESS_KEY = 'test'
    process.env.AWS_ENDPOINT_URL = awsEndpoint
    process.env.EVENTBRIDGE_ENABLED = 'true'
    process.env.EVENTBRIDGE_BUS_NAME = EVENTBRIDGE_DEFAULT_BUS_NAME

    await runMigrations()
    await runSeed()
    await syncRedisFromRds(process.env.REDIS_URL)
    queueUrl = await setupEventBridgeRuleToSqs(awsEndpoint)

    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), EventProcessorModule]
    }).compile()

    vehicleEntryHandler = moduleRef.get(VehicleEntryHandler)
  }, 240_000)

  afterAll(async () => {
    await moduleRef?.close()
    await Promise.all([postgres.stop(), redis.stop(), localstack.stop()])
  }, 60_000)

  it('publishes vehicle.entry and matches an EventBridge rule target', async () => {
    await reserveSpot({
      reservationId: 'res-eb-001',
      parkingSpotId: 'spot-05',
      userId: 'usr-12345'
    })

    await vehicleEntryHandler.handle({
      eventName: KAFKA_TOPICS.VEHICLE_ENTRY,
      aggregateId: 'evt-eb-entry-001',
      occurredAt: '2025-06-19T14:05:00.000Z',
      eventId: 'evt-eb-entry-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-05',
      vehiclePlate: 'ABC-123',
      reservationId: 'res-eb-001',
      gate: 'entry'
    })

    const sqs = new SQSClient(awsTestConfig(awsEndpoint))
    let messageBody: string | undefined

    for (let attempt = 0; attempt < 20; attempt++) {
      const response = await sqs.send(
        new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 1
        })
      )

      messageBody = response.Messages?.[0]?.Body

      if (messageBody) {
        break
      }

      await sleep(500)
    }

    expect(messageBody).toBeDefined()

    const envelope = JSON.parse(messageBody!) as {
      source: string
      'detail-type': string
      detail: string | Record<string, unknown>
    }

    expect(envelope.source).toBe(EVENTBRIDGE_SOURCE_EVENT_PROCESSOR)
    expect(envelope['detail-type']).toBe(KAFKA_TOPICS.VEHICLE_ENTRY)

    const detail = (
      typeof envelope.detail === 'string'
        ? JSON.parse(envelope.detail)
        : envelope.detail
    ) as {
      parkingSpotId: string
      previousStatus: string
      currentStatus: string
      reservationId?: string
    }

    expect(detail.parkingSpotId).toBe('spot-05')
    expect(detail.previousStatus).toBe('reserved')
    expect(detail.currentStatus).toBe('occupied')
    expect(detail.reservationId).toBe('res-eb-001')
  })
})
