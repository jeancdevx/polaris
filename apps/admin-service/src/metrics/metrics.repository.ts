import { Injectable } from '@nestjs/common'
import type { AuditLogRow, ReservationRow, UserRow } from '@polaris/database'

import { DatabaseService } from '../infrastructure/database.service.js'

import type { MetricsListQuery } from './metrics.types.js'

type EventTypeCountRow = Readonly<{
  eventType: string
  count: string
}>

@Injectable()
export class MetricsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async countUsers(): Promise<{ active: number; inactive: number }> {
    const dataSource = await this.databaseService.getDataSource()
    const repository = dataSource.getRepository<UserRow>('User')

    const [active, inactive] = await Promise.all([
      repository.count({ where: { isActive: true } }),
      repository.count({ where: { isActive: false } })
    ])

    return { active, inactive }
  }

  async countReservations(query: MetricsListQuery): Promise<{
    active: number
    checkedIn: number
    cancelledInRange: number
    expiredInRange: number
  }> {
    const dataSource = await this.databaseService.getDataSource()
    const repository = dataSource.getRepository<ReservationRow>('Reservation')

    const [active, checkedIn, cancelledInRange, expiredInRange] =
      await Promise.all([
        repository.count({ where: { status: 'active' } }),
        repository.count({ where: { status: 'checked_in' } }),
        repository
          .createQueryBuilder('reservation')
          .where('reservation.status = :status', { status: 'cancelled' })
          .andWhere('reservation.cancelled_at BETWEEN :from AND :to', {
            from: query.from,
            to: query.to
          })
          .getCount(),
        repository
          .createQueryBuilder('reservation')
          .where('reservation.status = :status', { status: 'expired' })
          .andWhere('reservation.expired_at BETWEEN :from AND :to', {
            from: query.from,
            to: query.to
          })
          .getCount()
      ])

    return {
      active,
      checkedIn,
      cancelledInRange,
      expiredInRange
    }
  }

  async summarizeAuditEvents(query: MetricsListQuery): Promise<{
    totalInRange: number
    byEventType: Record<string, number>
  }> {
    const dataSource = await this.databaseService.getDataSource()
    const repository = dataSource.getRepository<AuditLogRow>('AuditLog')

    const totalInRange = await repository
      .createQueryBuilder('audit')
      .where('audit.timestamp BETWEEN :from AND :to', {
        from: query.from,
        to: query.to
      })
      .getCount()

    const grouped = await repository
      .createQueryBuilder('audit')
      .select('audit.event_type', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .where('audit.timestamp BETWEEN :from AND :to', {
        from: query.from,
        to: query.to
      })
      .groupBy('audit.event_type')
      .orderBy('audit.event_type', 'ASC')
      .getRawMany<EventTypeCountRow>()

    const byEventType: Record<string, number> = {}

    for (const row of grouped) {
      byEventType[row.eventType] = Number.parseInt(row.count, 10)
    }

    return { totalInRange, byEventType }
  }
}
