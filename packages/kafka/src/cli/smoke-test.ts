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

const SMOKE_TIMEOUT_MS = 15_000

const waitForConsumerGroupJoin = async (
  consumer: Awaited<ReturnType<typeof createConsumer>>
): Promise<void> =>
  new Promise(resolve => {
    const { GROUP_JOIN } = consumer.events

    consumer.on(GROUP_JOIN, () => {
      resolve()
    })
  })

const runSmokeTest = async (): Promise<void> => {
  const smokeReservationId = `res-smoke-${randomUUID()}`
  const kafka = createKafka({ clientId: 'polaris-kafka-smoke' })
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
      }, SMOKE_TIMEOUT_MS)

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
              console.log(
                `Consumed ${event.eventName} for reservation ${event.reservationId}`
              )
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

    console.log(
      `Published ${event.eventName} to ${KAFKA_TOPICS.RESERVATION_CREATED}`
    )
    await received
    console.log('Kafka smoke test passed.')
  } finally {
    await disconnectConsumer(consumer)
    await disconnectProducer(producer)
  }
}

runSmokeTest().catch(error => {
  console.error('Kafka smoke test failed:', error)
  process.exit(1)
})
