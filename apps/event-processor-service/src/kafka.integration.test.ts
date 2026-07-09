import { ConfigModule } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import {
  KafkaContainer,
  type StartedKafkaContainer
} from '@testcontainers/kafka'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createEntryDeniedEvent,
  createOccupancyChangedEvent,
  createProximityDetectedEvent,
  createReservationCancelledEvent,
  createReservationCreatedEvent,
  createRfidValidatedEvent,
  createVehicleEnteredEvent,
  createVehicleExitedEvent,
  type DomainEvent
} from '@polaris/domain'
import {
  createKafka,
  createProducer,
  disconnectProducer,
  publishDomainEvent
} from '@polaris/kafka'
import { KAFKA_TOPICS, type KafkaTopic } from '@polaris/shared-types'
import { sleep } from '@polaris/shared-utils'

import { EventDispatcherService } from './processing/event-dispatcher.service.js'
import { EventProcessorModule } from './processing/event-processor.module.js'
import {
  ALL_KAFKA_TOPICS,
  KafkaConsumerService
} from './processing/kafka-consumer.service.js'

const kafkaBrokerAddress = (kafka: StartedKafkaContainer): string =>
  `${kafka.getHost()}:${kafka.getMappedPort(9093)}`

const ensureKafkaTopics = async (brokers: string[]): Promise<void> => {
  const kafka = createKafka({
    clientId: 'event-processor-integration-test-admin',
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
    topics: ALL_KAFKA_TOPICS.map(topic => ({
      topic,
      numPartitions: 1,
      replicationFactor: 1
    }))
  })
  await admin.disconnect()
}

const sampleEvents: ReadonlyArray<{
  topic: KafkaTopic
  event: DomainEvent
}> = [
  {
    topic: KAFKA_TOPICS.RESERVATION_CREATED,
    event: createReservationCreatedEvent({
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      expiresAt: '2025-06-19T13:00:00.000Z'
    })
  },
  {
    topic: KAFKA_TOPICS.RESERVATION_CANCELLED,
    event: createReservationCancelledEvent({
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      reason: 'user_cancelled'
    })
  },
  {
    topic: KAFKA_TOPICS.VEHICLE_ENTRY,
    event: createVehicleEnteredEvent({
      eventId: 'evt-entry-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      vehiclePlate: 'ABC-1234',
      reservationId: 'res-001'
    })
  },
  {
    topic: KAFKA_TOPICS.VEHICLE_EXIT,
    event: createVehicleExitedEvent({
      eventId: 'evt-exit-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      vehiclePlate: 'ABC-1234',
      reservationId: 'res-001'
    })
  },
  {
    topic: KAFKA_TOPICS.SENSOR_OCCUPANCY,
    event: createOccupancyChangedEvent({
      spotId: 'spot-05',
      status: 'occupied',
      deviceId: 'actuators-01'
    })
  },
  {
    topic: KAFKA_TOPICS.SENSOR_PROXIMITY,
    event: createProximityDetectedEvent({
      deviceId: 'entry-io-01',
      distanceCm: 8
    })
  },
  {
    topic: KAFKA_TOPICS.RFID_VALIDATION,
    event: createRfidValidatedEvent({
      rfidUid: 'A3:BF:22:01',
      readerLocation: 'entry',
      deviceId: 'entry-io-01',
      result: { valid: true, userId: 'usr-12345' }
    })
  },
  {
    topic: KAFKA_TOPICS.AUDIT_EVENTS,
    event: createEntryDeniedEvent({
      rfidUid: 'A3:BF:22:01',
      gate: 'entry',
      reason: 'no_active_reservation'
    })
  }
]

describe('event-processor kafka integration', () => {
  let kafka: StartedKafkaContainer
  let moduleRef: TestingModule

  beforeAll(async () => {
    kafka = await new KafkaContainer('confluentinc/cp-kafka:7.6.0').start()
    const brokers = kafkaBrokerAddress(kafka)

    process.env.KAFKA_BROKERS = brokers
    process.env.KAFKA_AUTH_MODE = 'plain'
    process.env.KAFKA_CLIENT_ID = 'event-processor-integration-test'
    process.env.KAFKA_CONSUMER_GROUP_ID = `event-processor-test-${Date.now()}`

    await ensureKafkaTopics([brokers])

    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), EventProcessorModule]
    }).compile()

    const app = moduleRef.createNestApplication()
    await app.init()
  }, 180_000)

  afterAll(async () => {
    await moduleRef?.close()
    await kafka?.stop()
  }, 60_000)

  it('consumes all 8 MSK topics with IAM/plain auth', async () => {
    const consumer = moduleRef.get(KafkaConsumerService)
    const dispatcher = moduleRef.get(EventDispatcherService)

    await consumer.whenReady()

    const kafkaClient = createKafka({
      clientId: 'event-processor-integration-test-producer',
      logLevel: 0
    })
    const producer = await createProducer(kafkaClient)

    try {
      for (const { topic, event } of sampleEvents) {
        await publishDomainEvent(producer, { topic, event })
      }

      for (let attempt = 0; attempt < 60; attempt++) {
        if (dispatcher.hasProcessedAllTopics()) {
          break
        }

        await sleep(500)
      }

      expect(dispatcher.hasProcessedAllTopics()).toBe(true)
      expect(dispatcher.getTotalProcessed()).toBe(ALL_KAFKA_TOPICS.length)

      for (const topic of ALL_KAFKA_TOPICS) {
        expect(dispatcher.getProcessedCount(topic)).toBe(1)
      }
    } finally {
      await disconnectProducer(producer)
    }
  })
})
