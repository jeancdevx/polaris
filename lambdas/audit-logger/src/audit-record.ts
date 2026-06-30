export type AuditRecord = Readonly<{
  eventType: string
  aggregateId: string
  occurredAt: string
  source: string
  payload: Record<string, unknown>
}>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readDetail = (detail: unknown): Record<string, unknown> => {
  if (typeof detail === 'string') {
    return JSON.parse(detail) as Record<string, unknown>
  }

  if (isRecord(detail)) {
    return detail
  }

  return { detail }
}

const readAggregateId = (
  detail: Record<string, unknown>,
  fallback?: string
): string => {
  const aggregateId = detail.aggregateId ?? detail.eventId ?? fallback

  if (typeof aggregateId === 'string' && aggregateId.length > 0) {
    return aggregateId
  }

  return 'unknown'
}

const readOccurredAt = (
  detail: Record<string, unknown>,
  fallback?: string
): string => {
  const occurredAt = detail.occurredAt ?? detail.processedAt ?? fallback

  if (typeof occurredAt === 'string' && occurredAt.length > 0) {
    return occurredAt
  }

  return new Date().toISOString()
}

export const parseIncomingAuditEvent = (raw: unknown): AuditRecord => {
  if (!isRecord(raw)) {
    throw new Error('Audit event must be an object')
  }

  if (
    typeof raw.source === 'string' &&
    typeof raw['detail-type'] === 'string'
  ) {
    const detail = readDetail(raw.detail)

    return {
      eventType: raw['detail-type'],
      aggregateId: readAggregateId(
        detail,
        typeof raw.id === 'string' ? raw.id : undefined
      ),
      occurredAt: readOccurredAt(
        detail,
        typeof raw.time === 'string' ? raw.time : undefined
      ),
      source: raw.source,
      payload: detail
    }
  }

  if (raw.eventName === 'audit.events' || typeof raw.eventType === 'string') {
    return {
      eventType:
        typeof raw.eventType === 'string'
          ? raw.eventType
          : String(raw.eventName),
      aggregateId: readAggregateId(raw),
      occurredAt: readOccurredAt(raw),
      source: 'polaris.kafka',
      payload: raw
    }
  }

  throw new Error('Unsupported audit event format')
}

export const buildS3ObjectKey = (
  prefix: string,
  record: AuditRecord
): string => {
  const occurredAt = new Date(record.occurredAt)
  const year = occurredAt.getUTCFullYear()
  const month = String(occurredAt.getUTCMonth() + 1).padStart(2, '0')
  const day = String(occurredAt.getUTCDate()).padStart(2, '0')
  const safeAggregateId = record.aggregateId.replace(/[^\w.-]+/g, '_')
  const timestamp = occurredAt.getTime()

  return `${prefix}/year=${year}/month=${month}/day=${day}/${timestamp}-${safeAggregateId}.json`
}

export const buildAuditLogStreamName = (occurredAt: string): string => {
  const date = new Date(occurredAt)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `audit-${year}-${month}-${day}`
}
