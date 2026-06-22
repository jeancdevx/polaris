import { EntitySchema } from 'typeorm'

import type { UserType } from '@polaris/shared-types'

export type AuditLogRow = Readonly<{
  logId: string
  eventType: string
  userId?: string
  userType?: UserType
  vehiclePlate?: string
  parkingSpotId?: string
  gate?: string
  metadata?: Record<string, unknown>
  timestamp: Date
}>

export const auditLogSchema = new EntitySchema<AuditLogRow>({
  name: 'AuditLog',
  tableName: 'audit_logs',
  columns: {
    logId: {
      type: 'uuid',
      primary: true,
      name: 'log_id',
      generated: 'uuid'
    },
    eventType: {
      type: 'varchar',
      length: 100,
      name: 'event_type'
    },
    userId: {
      type: 'varchar',
      length: 32,
      nullable: true,
      name: 'user_id'
    },
    userType: {
      type: 'varchar',
      length: 20,
      nullable: true,
      name: 'user_type'
    },
    vehiclePlate: {
      type: 'varchar',
      length: 16,
      nullable: true,
      name: 'vehicle_plate'
    },
    parkingSpotId: {
      type: 'varchar',
      length: 16,
      nullable: true,
      name: 'parking_spot_id'
    },
    gate: {
      type: 'varchar',
      length: 50,
      nullable: true
    },
    metadata: {
      type: 'jsonb',
      nullable: true
    },
    timestamp: {
      type: 'timestamptz',
      createDate: true
    }
  }
})
