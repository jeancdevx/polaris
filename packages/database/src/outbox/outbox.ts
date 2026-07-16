import type { EntityManager } from 'typeorm'

import type { OutboxEventRow } from '../entities/schemas/outbox-event.schema.js'

export type EnqueueOutboxEventInput = Readonly<{
  topic: string
  partitionKey: string
  payload: Record<string, unknown>
  eventId?: string
  availableAt?: Date
}>

export const enqueueOutboxEvent = async (
  manager: EntityManager,
  input: EnqueueOutboxEventInput
): Promise<OutboxEventRow> => {
  const repository = manager.getRepository<OutboxEventRow>('OutboxEvent')
  const row = repository.create({
    eventId: input.eventId,
    topic: input.topic,
    partitionKey: input.partitionKey,
    payload: input.payload,
    status: 'pending',
    attempts: 0,
    availableAt: input.availableAt ?? new Date(),
    createdAt: new Date()
  })

  return repository.save(row)
}

export const outboxPayload = (
  event: {
    eventName: string
    aggregateId: string
    occurredAt: Date
    payload: Record<string, unknown>
  },
  eventId?: string
): Record<string, unknown> => ({
  eventId,
  eventName: event.eventName,
  aggregateId: event.aggregateId,
  occurredAt: event.occurredAt.toISOString(),
  ...event.payload
})
