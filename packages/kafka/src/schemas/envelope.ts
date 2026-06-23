import { kafkaMessageError } from '../errors/kafka-message-error.js'

export type KafkaEventEnvelope = Readonly<{
  eventName: string
  aggregateId: string
  occurredAt: string
}>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

export const parseJsonValue = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    throw kafkaMessageError(
      'INVALID_JSON',
      'Kafka message value is not valid JSON'
    )
  }
}

export const parseKafkaEnvelope = (raw: unknown): KafkaEventEnvelope => {
  if (!isRecord(raw)) {
    throw kafkaMessageError(
      'INVALID_ENVELOPE',
      'Kafka message must be a JSON object'
    )
  }

  if (!isNonEmptyString(raw.eventName)) {
    throw kafkaMessageError('INVALID_ENVELOPE', 'eventName is required')
  }

  if (!isNonEmptyString(raw.aggregateId)) {
    throw kafkaMessageError('INVALID_ENVELOPE', 'aggregateId is required')
  }

  if (!isNonEmptyString(raw.occurredAt)) {
    throw kafkaMessageError('INVALID_ENVELOPE', 'occurredAt is required')
  }

  return {
    eventName: raw.eventName,
    aggregateId: raw.aggregateId,
    occurredAt: raw.occurredAt
  }
}

export const requireStringField = (
  record: Record<string, unknown>,
  field: string
): string => {
  const value = record[field]

  if (!isNonEmptyString(value)) {
    throw kafkaMessageError(
      'INVALID_FIELD',
      `${field} must be a non-empty string`
    )
  }

  return value
}

export const optionalStringField = (
  record: Record<string, unknown>,
  field: string
): string | undefined => {
  const value = record[field]

  if (value === undefined) {
    return undefined
  }

  if (!isNonEmptyString(value)) {
    throw kafkaMessageError(
      'INVALID_FIELD',
      `${field} must be a non-empty string`
    )
  }

  return value
}
