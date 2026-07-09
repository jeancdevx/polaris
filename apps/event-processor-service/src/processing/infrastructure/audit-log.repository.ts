import { Injectable } from '@nestjs/common'

import type { AuditLogRow } from '@polaris/database'

import { DatabaseService } from './database.service.js'

export type InsertAuditLogInput = Readonly<{
  eventType: string
  userId?: string
  userType?: AuditLogRow['userType']
  vehiclePlate?: string
  parkingSpotId?: string
  gate?: string
  metadata?: Record<string, unknown>
  timestamp?: Date
}>

@Injectable()
export class AuditLogRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async insert(input: InsertAuditLogInput): Promise<void> {
    const dataSource = await this.databaseService.getDataSource()
    const repository = dataSource.getRepository<AuditLogRow>('AuditLog')

    await repository.save({
      eventType: input.eventType,
      userId: input.userId,
      userType: input.userType,
      vehiclePlate: input.vehiclePlate,
      parkingSpotId: input.parkingSpotId,
      gate: input.gate,
      metadata: input.metadata,
      timestamp: input.timestamp ?? new Date()
    })
  }
}
