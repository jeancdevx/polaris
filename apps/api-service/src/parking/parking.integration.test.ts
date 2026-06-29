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

import { runMigrations, runSeed } from '@polaris/database'

import { PARKING_SPOT_KEY_PREFIX } from './parking.constants.js'
import { ParkingModule } from './parking.module.js'
import { ParkingService } from './parking.service.js'

describe('parking availability integration', () => {
  let postgres: StartedPostgreSqlContainer
  let redis: StartedRedisContainer
  let moduleRef: TestingModule
  let parkingService: ParkingService

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

    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), ParkingModule]
    }).compile()

    parkingService = moduleRef.get(ParkingService)
  }, 180_000)

  afterAll(async () => {
    await moduleRef?.close()
    await Promise.all([postgres.stop(), redis.stop()])
  }, 60_000)

  it('falls back to RDS when Redis has no spot keys', async () => {
    const status = await parkingService.getAvailability()

    expect(status.totalSpots).toBe(10)
    expect(status.totalAvailable).toBe(10)
    expect(status.totalOccupied).toBe(0)
    expect(status.totalReserved).toBe(0)
    expect(status.spots).toHaveLength(10)
  })

  it('serves availability from Redis when spot keys exist', async () => {
    const client = createClient({ url: process.env.REDIS_URL })
    await client.connect()

    try {
      const spotIds = Array.from(
        { length: 10 },
        (_, index) => `spot-${String(index + 1).padStart(2, '0')}`
      )

      for (const spotId of spotIds) {
        const status =
          spotId === 'spot-01'
            ? 'occupied'
            : spotId === 'spot-02'
              ? 'reserved'
              : 'free'

        await client.hSet(`${PARKING_SPOT_KEY_PREFIX}${spotId}`, { status })
      }

      const status = await parkingService.getAvailability()

      expect(status.totalSpots).toBe(10)
      expect(status.totalAvailable).toBe(8)
      expect(status.totalOccupied).toBe(1)
      expect(status.totalReserved).toBe(1)
      expect(status.spots.find(spot => spot.spotId === 'spot-01')?.status).toBe(
        'occupied'
      )
    } finally {
      await client.quit()
    }
  })
})
