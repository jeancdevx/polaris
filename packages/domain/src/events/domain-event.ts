import { formatTimestamp } from '@polaris/shared-utils'

export type DomainEventPayload = Record<string, unknown>

export type DomainEvent = Readonly<{
  eventName: string
  aggregateId: string
  occurredAt: Date
  payload: DomainEventPayload
}>

export const createDomainEvent = (input: {
  eventName: string
  aggregateId: string
  payload: DomainEventPayload
  occurredAt?: Date
}): DomainEvent => ({
  eventName: input.eventName,
  aggregateId: input.aggregateId,
  occurredAt: input.occurredAt ?? new Date(),
  payload: input.payload
})

export const domainEventToJson = (event: DomainEvent): DomainEventPayload => ({
  eventName: event.eventName,
  aggregateId: event.aggregateId,
  occurredAt: formatTimestamp(event.occurredAt),
  ...event.payload
})
