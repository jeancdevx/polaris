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
  type AuditLogRow,
  type ReservationRow
} from '@polaris/database'

import { DatabaseModule } from '../infrastructure/database.module.js'
import { metricsConfig } from './metrics.config.js'
import { MetricsModule } from './metrics.module.js'
import { MetricsService } from './metrics.service.js'
import { PARKING_SPOT_KEY_PREFIX } from './parking.constants.js'

const syncRedisSpot = async (
  redisUrl: string,
  spotId: string,
  status: 'free' | 'occupied' | 'reserved'
): Promise<void> => {
  const redis = createClient({ url: redisUrl })
  await redis.connect()

  try {
    await redis.hSet(`${PARKING_SPOT_KEY_PREFIX}${spotId}`, { status })
  } finally {
    await redis.quit()
  }
}

describe('metrics integration', () => {
  let postgres: StartedPostgreSqlContainer
  let redis: StartedRedisContainer
  let moduleRef: TestingModule
  let metricsService: MetricsService

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

    await runMigrations()
    await runSeed()

    const dataSource = createDataSource()
    await dataSource.initialize()

    try {
      await dataSource.getRepository<AuditLogRow>('AuditLog').save({
        eventType: 'vehicle.entry',
        userId: 'usr-12345',
        userType: 'registered',
        parkingSpotId: 'spot-05',
        timestamp: new Date('2025-06-19T14:05:00.000Z')
      })

      await dataSource.getRepository<ReservationRow>('Reservation').save({
        reservationId: 'res-metrics-001',
        userId: 'usr-12345',
        parkingSpotId: 'spot-05',
        status: 'active',
        reservationDate: new Date('2025-06-19T14:00:00.000Z'),
        expiresAt: new Date('2025-06-19T16:00:00.000Z'),
        createdAt: new Date('2025-06-19T14:00:00.000Z')
      })
    } finally {
      await dataSource.destroy()
    }

    await syncRedisSpot(process.env.REDIS_URL, 'spot-05', 'reserved')

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ConfigModule.forFeature(metricsConfig),
        DatabaseModule,
        MetricsModule
      ]
    }).compile()

    metricsService = moduleRef.get(MetricsService)
  }, 120_000)

  afterAll(async () => {
    await moduleRef?.close()
    await Promise.all([postgres.stop(), redis.stop()])
  }, 60_000)

  it('returns occupancy, reservation and audit metrics', async () => {
    const metrics = await metricsService.getMetrics({
      from: new Date('2025-06-19T00:00:00.000Z'),
      to: new Date('2025-06-19T23:59:59.999Z')
    })

    expect(metrics.occupancy.totalSpots).toBeGreaterThan(0)
    expect(metrics.users.active).toBeGreaterThan(0)
    expect(metrics.reservations.active).toBeGreaterThanOrEqual(1)
    expect(metrics.audit.totalInRange).toBeGreaterThanOrEqual(1)
    expect(metrics.audit.byEventType['vehicle.entry']).toBeGreaterThanOrEqual(1)
  })
})
