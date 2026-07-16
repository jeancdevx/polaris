import { EntitySchema } from 'typeorm'

import { createdAtColumn } from './timestamp-columns.js'

export type ConsumedEventRow = Readonly<{
  consumerName: string
  eventId: string
  topic: string
  partition: number
  offset: string
  status: 'processing' | 'completed'
  processedAt?: Date
  createdAt: Date
}>

export const consumedEventSchema = new EntitySchema<ConsumedEventRow>({
  name: 'ConsumedEvent',
  tableName: 'consumed_events',
  columns: {
    consumerName: {
      type: 'varchar',
      length: 128,
      primary: true,
      name: 'consumer_name'
    },
    eventId: {
      type: 'varchar',
      length: 256,
      primary: true,
      name: 'event_id'
    },
    topic: { type: 'varchar', length: 128 },
    partition: { type: 'integer' },
    offset: { type: 'varchar', length: 32 },
    status: { type: 'varchar', length: 20 },
    processedAt: {
      type: 'timestamptz',
      nullable: true,
      name: 'processed_at'
    },
    createdAt: createdAtColumn()
  }
})
