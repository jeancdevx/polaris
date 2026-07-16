import { EntitySchema } from 'typeorm'

import { createdAtColumn } from './timestamp-columns.js'

export type OutboxEventStatus =
  | 'pending'
  | 'processing'
  | 'published'
  | 'failed'

export type OutboxEventRow = Readonly<{
  eventId: string
  topic: string
  partitionKey: string
  payload: Record<string, unknown>
  status: OutboxEventStatus
  attempts: number
  availableAt: Date
  lockedAt?: Date
  publishedAt?: Date
  lastError?: string
  createdAt: Date
}>

export const outboxEventSchema = new EntitySchema<OutboxEventRow>({
  name: 'OutboxEvent',
  tableName: 'outbox_events',
  columns: {
    eventId: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
      name: 'event_id'
    },
    topic: { type: 'varchar', length: 128 },
    partitionKey: {
      type: 'varchar',
      length: 128,
      name: 'partition_key'
    },
    payload: { type: 'jsonb' },
    status: { type: 'varchar', length: 20, default: 'pending' },
    attempts: { type: 'integer', default: 0 },
    availableAt: {
      type: 'timestamptz',
      name: 'available_at',
      default: () => 'CURRENT_TIMESTAMP'
    },
    lockedAt: { type: 'timestamptz', nullable: true, name: 'locked_at' },
    publishedAt: {
      type: 'timestamptz',
      nullable: true,
      name: 'published_at'
    },
    lastError: { type: 'text', nullable: true, name: 'last_error' },
    createdAt: createdAtColumn()
  }
})
