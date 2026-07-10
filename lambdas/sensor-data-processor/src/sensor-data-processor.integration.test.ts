import {
  KafkaContainer,
  type StartedKafkaContainer
} from '@testcontainers/kafka'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createConsumer,
  createKafka,
  disconnectConsumer,
  parseOccupancyChangedEvent
} from '@polaris/kafka'
import { KAFKA_TOPICS } from '@polaris/shared-types'

import type { SensorReadingsRepository } from './repositories/sensor-readings.repository.js'

import type { OccupancyChangedIoTEvent } from './iot-event.js'
import {
  createProcessSensorReadingDependencies,
  processSensorReading
} from './process-sensor-reading.js'
import { KafkaOccupancyPublisher } from './publishers/kafka-occupancy.publisher.js'

const kafkaBrokerAddress = (kafka: StartedKafkaContainer): string =>
  `${kafka.getHost()}:${kafka.getMappedPort(9093)}`

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, ms)
  })

const ensureKafkaTopics = async (brokers: string[]): Promise<void> => {
  const kafka = createKafka({
    clientId: 'sensor-data-processor-integration-test',
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
        topic: KAFKA_TOPICS.SENSOR_OCCUPANCY,
        numPartitions: 1,
        replicationFactor: 1
      }
    ]
  })
  await admin.disconnect()
}

describe('sensor-data-processor integration', () => {
  let kafka: StartedKafkaContainer | undefined

  beforeAll(async () => {
    kafka = await new KafkaContainer('confluentinc/cp-kafka:7.6.1').start()
    const brokers = [kafkaBrokerAddress(kafka)]

    process.env.KAFKA_BROKERS = brokers.join(',')
    process.env.KAFKA_AUTH_MODE = 'plaintext'

    await ensureKafkaTopics(brokers)
  }, 120_000)

  afterAll(async () => {
    if (kafka) {
      await kafka.stop()
    }
  })

  it('publishes sensor.occupancy events to Kafka', async () => {
    if (!kafka) {
      throw new Error('Kafka container not started')
    }

    const brokers = [kafkaBrokerAddress(kafka)]
    const reading: OccupancyChangedIoTEvent = {
      deviceId: 'actuators-01',
      spotId: 'spot-01',
      status: 'occupied',
      sensorType: 'fc-51',
      occurredAt: new Date('2025-06-19T15:00:00.000Z')
    }

    const savedRecords: unknown[] = []
    const sensorReadings = {
      saveOccupancyReading: async (input: OccupancyChangedIoTEvent) => {
        const record = {
          sensorId: input.spotId,
          timestamp: input.occurredAt.toISOString(),
          deviceId: input.deviceId,
          spotId: input.spotId,
          status: input.status,
          sensorType: input.sensorType,
          event: 'occupancy_changed' as const
        }
        savedRecords.push(record)
        return record
      }
    } as unknown as SensorReadingsRepository

    const deps = {
      ...createProcessSensorReadingDependencies({
        sensorReadingsTableName: 'test-SensorReadings',
        sensorReadingsTtlDays: 0,
        kafkaClientId: 'sensor-data-processor-integration',
        ledCommandsEnabled: false
      }),
      sensorReadings,
      kafkaPublisher: new KafkaOccupancyPublisher(
        'sensor-data-processor-integration'
      )
    }

    const consumer = await createConsumer(
      'sensor-data-processor-integration',
      createKafka({
        clientId: 'sensor-data-processor-integration-consumer',
        brokers
      })
    )

    await consumer.subscribe({
      topic: KAFKA_TOPICS.SENSOR_OCCUPANCY,
      fromBeginning: true
    })

    const messagePromise = new Promise<
      ReturnType<typeof parseOccupancyChangedEvent>
    >((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for sensor.occupancy message'))
      }, 15_000)

      consumer.run({
        eachMessage: async ({ message }) => {
          if (!message.value) {
            return
          }

          clearTimeout(timeout)
          resolve(
            parseOccupancyChangedEvent(JSON.parse(message.value.toString()))
          )
        }
      })
    })

    const result = await processSensorReading(reading, deps)

    expect(result.kafkaPublished).toBe(true)
    expect(savedRecords).toHaveLength(1)

    const event = await messagePromise

    expect(event.spotId).toBe('spot-01')
    expect(event.status).toBe('occupied')
    expect(event.deviceId).toBe('actuators-01')

    await disconnectConsumer(consumer)
    await deps.kafkaPublisher.disconnect()
  })
})
