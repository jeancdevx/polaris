export type LedSyncRequestIoTEvent = Readonly<{
  deviceId: string
  spotFirst: number
  spotLast: number
  occurredAt: Date
}>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readString = (
  record: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = record[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

const readPositiveInt = (
  record: Record<string, unknown>,
  key: string
): number | undefined => {
  const value = record[key]

  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)

    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }

  return undefined
}

const readTimestamp = (record: Record<string, unknown>): Date => {
  const timestamp = record.timestamp

  if (typeof timestamp === 'number') {
    return new Date(timestamp)
  }

  if (typeof timestamp === 'string') {
    const parsed = Date.parse(timestamp)

    if (!Number.isNaN(parsed)) {
      return new Date(parsed)
    }
  }

  return new Date()
}

const unwrapPayload = (raw: unknown): Record<string, unknown> => {
  if (!isRecord(raw)) {
    throw new Error('LED sync event must be an object')
  }

  if (isRecord(raw.payload)) {
    return raw.payload
  }

  return raw
}

export const parseLedSyncRequestIoTEvent = (
  raw: unknown
): LedSyncRequestIoTEvent => {
  const record = unwrapPayload(raw)

  const deviceId = readString(record, 'deviceId')
  const spotFirst = readPositiveInt(record, 'spotFirst')
  const spotLast = readPositiveInt(record, 'spotLast')
  const event = readString(record, 'event')

  if (!deviceId) {
    throw new Error('deviceId is required')
  }

  if (event !== undefined && event !== 'led_sync_request') {
    throw new Error('event must be led_sync_request')
  }

  if (!spotFirst || !spotLast) {
    throw new Error('spotFirst and spotLast are required')
  }

  if (spotFirst > spotLast) {
    throw new Error('spotFirst must be <= spotLast')
  }

  return {
    deviceId,
    spotFirst,
    spotLast,
    occurredAt: readTimestamp(record)
  }
}
