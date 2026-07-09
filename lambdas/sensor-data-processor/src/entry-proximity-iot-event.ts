import type { EntryProximityTelemetryEventName } from '@polaris/domain'

export type EntryProximityIoTEvent = Readonly<{
  deviceId: string
  event: EntryProximityTelemetryEventName
  distanceCm?: number
  gateState?: string
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

const readEventName = (
  value: unknown
): EntryProximityTelemetryEventName | undefined => {
  if (
    value === 'proximity_detected' ||
    value === 'proximity_timeout' ||
    value === 'passage_in_progress' ||
    value === 'passage_stalled' ||
    value === 'exit_barrier_timeout'
  ) {
    return value
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
    throw new Error('Proximity event must be an object')
  }

  if (isRecord(raw.payload)) {
    return raw.payload
  }

  return raw
}

export const parseEntryProximityIoTEvent = (
  raw: unknown
): EntryProximityIoTEvent => {
  const record = unwrapPayload(raw)
  const deviceId = readString(record, 'deviceId')
  const event = readEventName(record.event)
  const distanceCm =
    typeof record.distanceCm === 'number'
      ? record.distanceCm
      : typeof record.distance_cm === 'number'
        ? record.distance_cm
        : undefined
  const gateState =
    readString(record, 'gateState') ?? readString(record, 'gate_state')

  if (!deviceId) {
    throw new Error('deviceId is required')
  }

  if (!event) {
    throw new Error('event is required')
  }

  if (event === 'proximity_detected' && distanceCm === undefined) {
    throw new Error('distanceCm is required for proximity_detected')
  }

  return {
    deviceId,
    event,
    ...(distanceCm !== undefined ? { distanceCm } : {}),
    ...(gateState !== undefined ? { gateState } : {}),
    occurredAt: readTimestamp(record)
  }
}
