import { randomUUID } from 'node:crypto'

import { logLevel } from 'kafkajs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { KAFKA_TOPICS } from '@polaris/shared-types'
import { parkingSpotKey } from '@polaris/shared-utils'

import {
  applyIntegrationEnv,
  startIntegrationContainers,
  stopIntegrationContainers,
  type IntegrationContainers
} from './containers/start-containers.js'

describe('Phase 1 — integration (testcontainers)', () => {
  let containers: IntegrationContainers

  beforeAll(async () => {
    containers = await startIntegrationContainers()
    applyIntegrationEnv(containers)
  }, 180_000)

  afterAll(async () => {
    await stopIntegrationContainers(containers)
  }, 60_000)

  describe('PostgreSQL', () => {
    it('runs migrations and seeds parking data', async () => {
      const { createDataSource, runMigrations, runSeed } =
        await import('@polaris/database')

      await runMigrations()

      const seedResult = await runSeed()
      expect(seedResult).toEqual({
        users: 11,
        parkingSpots: 10,
        rfidTags: 10
      })

      const dataSource = createDataSource()
      await dataSource.initialize()

      try {
        const users = await dataSource.query<{ count: string }[]>(
          `SELECT COUNT(*)::text AS count FROM users`
        )
        const spots = await dataSource.query<{ count: string }[]>(
          `SELECT COUNT(*)::text AS count FROM parking_spots WHERE status = 'free'`
        )

        expect(users[0]?.count).toBe('11')
        expect(spots[0]?.count).toBe('10')
      } finally {
        await dataSource.destroy()
      }
    })
  })

  describe('Redis', () => {
    it('stores and reads occupancy cache keys', async () => {
      const { createClient } = await import('redis')
      const client = createClient({ url: process.env.REDIS_URL })

      await client.connect()

      try {
        await client.hSet(parkingSpotKey('03'), {
          status: 'reserved',
          userId: 'usr-12345',
          reservationId: 'res-001'
        })

        const occupancy = await client.hGetAll(parkingSpotKey('03'))
        expect(occupancy).toEqual({
          status: 'reserved',
          userId: 'usr-12345',
          reservationId: 'res-001'
        })
      } finally {
        await client.quit()
      }
    })
  })

  describe('Kafka', () => {
    it('publishes and consumes a domain event', async () => {
      const { createReservationCreatedEvent } = await import('@polaris/domain')
      const {
        createConsumer,
        createKafka,
        createProducer,
        disconnectConsumer,
        disconnectProducer,
        parseReservationCreatedEvent,
        publishDomainEvent
      } = await import('@polaris/kafka')

      const kafka = createKafka({
        clientId: 'polaris-integration-test',
        brokers: process.env.KAFKA_BROKERS?.split(',') ?? [],
        logLevel: logLevel.NOTHING
      })
      const admin = kafka.admin()

      for (let attempt = 0; attempt < 30; attempt++) {
        try {
          await admin.connect()
          break
        } catch {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      await admin.createTopics({
        topics: Object.values(KAFKA_TOPICS).map(topic => ({
          topic,
          numPartitions: 1,
          replicationFactor: 1
        }))
      })
      await admin.disconnect()

      const smokeReservationId = `res-integration-${randomUUID()}`
      const groupId = `polaris-integration-${randomUUID()}`
      const consumer = await createConsumer(groupId, kafka)
      const producer = await createProducer(kafka)

      try {
        const joined = new Promise<void>(resolve => {
          consumer.on(consumer.events.GROUP_JOIN, () => {
            resolve()
          })
        })

        await consumer.subscribe({
          topics: [KAFKA_TOPICS.RESERVATION_CREATED],
          fromBeginning: true
        })

        const received = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timed out waiting for Kafka message'))
          }, 60_000)

          consumer
            .run({
              eachMessage: async payload => {
                const event = parseReservationCreatedEvent(
                  JSON.parse(payload.message.value?.toString('utf8') ?? '{}')
                )

                if (event.reservationId !== smokeReservationId) {
                  return
                }

                clearTimeout(timeout)
                resolve()
              }
            })
            .catch(reject)
        })

        await joined

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
      } finally {
        await disconnectConsumer(consumer)
        await disconnectProducer(producer)
      }
    })
  })
})
