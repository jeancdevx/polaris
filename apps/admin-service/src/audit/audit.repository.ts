import { Injectable } from '@nestjs/common'
import type { AuditLogRow } from '@polaris/database'

import { DatabaseService } from '../infrastructure/database.service.js'

import type { AuditLogListQuery } from './audit.types.js'

@Injectable()
export class AuditRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findLogs(query: AuditLogListQuery): Promise<{
    rows: AuditLogRow[]
    total: number
  }> {
    const dataSource = await this.databaseService.getDataSource()
    const qb = dataSource
      .getRepository<AuditLogRow>('AuditLog')
      .createQueryBuilder('audit')

    if (query.eventType) {
      qb.andWhere('audit.event_type = :eventType', {
        eventType: query.eventType
      })
    }

    if (query.userId) {
      qb.andWhere('audit.user_id = :userId', { userId: query.userId })
    }

    if (query.parkingSpotId) {
      qb.andWhere('audit.parking_spot_id = :parkingSpotId', {
        parkingSpotId: query.parkingSpotId
      })
    }

    if (query.gate) {
      qb.andWhere('audit.gate = :gate', { gate: query.gate })
    }

    if (query.userType) {
      qb.andWhere('audit.user_type = :userType', { userType: query.userType })
    }

    if (query.from) {
      qb.andWhere('audit.timestamp >= :from', { from: query.from })
    }

    if (query.to) {
      qb.andWhere('audit.timestamp <= :to', { to: query.to })
    }

    const [rows, total] = await qb
      .orderBy('audit.timestamp', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount()

    return { rows, total }
  }
}
