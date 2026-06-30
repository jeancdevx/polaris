import { ConfigModule } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer
} from '@testcontainers/postgresql'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createDataSource,
  runMigrations,
  type AuditLogRow
} from '@polaris/database'

import { DatabaseModule } from '../infrastructure/database.module.js'
import { AuditModule } from './audit.module.js'
import { AuditService } from './audit.service.js'

describe('audit integration', () => {
  let postgres: StartedPostgreSqlContainer
  let moduleRef: TestingModule
  let auditService: AuditService

  beforeAll(async () => {
    postgres = await new PostgreSqlContainer('postgres:17.10-alpine')
      .withDatabase('parking_db')
      .withUsername('parking_admin')
      .withPassword('parking_dev')
      .start()

    process.env.DATABASE_URL = postgres.getConnectionUri()

    await runMigrations()

    const dataSource = createDataSource()
    await dataSource.initialize()

    try {
      await dataSource.getRepository<AuditLogRow>('AuditLog').save([
        {
          eventType: 'vehicle.entry',
          userId: 'usr-12345',
          userType: 'registered',
          vehiclePlate: 'ABC-123',
          parkingSpotId: 'spot-03',
          gate: 'entry',
          timestamp: new Date('2025-06-19T14:05:00.000Z')
        },
        {
          eventType: 'vehicle.exit',
          userId: 'usr-12345',
          userType: 'registered',
          vehiclePlate: 'ABC-123',
          parkingSpotId: 'spot-03',
          gate: 'exit',
          timestamp: new Date('2025-06-19T15:05:00.000Z')
        },
        {
          eventType: 'user_created',
          userId: 'usr-admin01',
          userType: 'registered',
          timestamp: new Date('2025-06-18T10:00:00.000Z')
        }
      ])
    } finally {
      await dataSource.destroy()
    }

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        AuditModule
      ]
    }).compile()

    auditService = moduleRef.get(AuditService)
  }, 120_000)

  afterAll(async () => {
    await moduleRef?.close()
    await postgres.stop()
  }, 60_000)

  it('lists audit logs with pagination and filters', async () => {
    const pageOne = await auditService.list({
      page: 1,
      limit: 2
    })

    expect(pageOne.total).toBe(3)
    expect(pageOne.items).toHaveLength(2)
    expect(pageOne.totalPages).toBe(2)

    const filtered = await auditService.list({
      page: 1,
      limit: 20,
      eventType: 'vehicle.entry',
      userId: 'usr-12345',
      from: new Date('2025-06-19T00:00:00.000Z'),
      to: new Date('2025-06-19T23:59:59.999Z')
    })

    expect(filtered.total).toBe(1)
    expect(filtered.items[0]?.eventType).toBe('vehicle.entry')
    expect(filtered.items[0]?.parkingSpotId).toBe('spot-03')
  })
})
