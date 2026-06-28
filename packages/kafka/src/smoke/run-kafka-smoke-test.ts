import { randomUUID } from 'node:crypto'

import { createReservationCreatedEvent } from '@polaris/domain'
import { KAFKA_TOPICS } from '@polaris/shared-types'
import { sleep } from '@polaris/shared-utils'

import { parseReservationCreatedEvent } from '../schemas/event-schemas.js'

import { createKafka } from '../config/create-kafka.js'

import {
  createConsumer,
  disconnectConsumer
} from '../consumer/create-consumer.js'
import {
  createProducer,
  disconnectProducer,
  publishDomainEvent
} from '../producer/create-producer.js'

export type KafkaSmokeTestOptions = Readonly<{
  clientId?: string
  timeoutMs?: number
}>

export type KafkaSmokeTestResult = Readonly<{
  status: 'passed'
  topic: string
  reservationId: string
  consumerGroupId: string
}>

const DEFAULT_TIMEOUT_MS = 15_000

const waitForConsumerGroupJoin = async (
  consumer: Awaited<ReturnType<typeof createConsumer>>
): Promise<void> =>
  new Promise(resolve => {
    const { GROUP_JOIN } = consumer.events

    consumer.on(GROUP_JOIN, () => {
      resolve()
    })
  })

export const runKafkaSmokeTest = async (
  options: KafkaSmokeTestOptions = {}
): Promise<KafkaSmokeTestResult> => {
  const smokeReservationId = `res-smoke-${randomUUID()}`
  const clientId = options.clientId ?? 'polaris-kafka-smoke'
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const kafka = createKafka({ clientId })
  const groupId = `polaris-smoke-${randomUUID()}`
  const consumer = await createConsumer(groupId, kafka)
  const producer = await createProducer(kafka)

  try {
    const joined = waitForConsumerGroupJoin(consumer)

    await consumer.subscribe({
      topics: [KAFKA_TOPICS.RESERVATION_CREATED],
      fromBeginning: true
    })

    const received = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for Kafka message'))
      }, timeoutMs)

      consumer
        .run({
          eachMessage: async payload => {
            try {
              const event = parseReservationCreatedEvent(
                JSON.parse(payload.message.value?.toString('utf8') ?? '{}')
              )

              if (event.reservationId !== smokeReservationId) {
                return
              }

              clearTimeout(timeout)
              resolve()
            } catch (error) {
              clearTimeout(timeout)
              reject(error)
            }
          }
        })
        .catch(reject)
    })

    await joined
    await sleep(250)

    const event = createReservationCreatedEvent({
      reservationId: smokeReservationId,
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      expiresAt: '2025-06-19T12:00:00.000Z'
    })

    await publishDomainEvent(producer, {
      topic: KAFKA_TOPICS.RESERVATION_CREATED,
      event
    })

    await received

    return {
      status: 'passed',
      topic: KAFKA_TOPICS.RESERVATION_CREATED,
      reservationId: smokeReservationId,
      consumerGroupId: groupId
    }
  } finally {
    await disconnectConsumer(consumer)
    await disconnectProducer(producer)
  }
}
