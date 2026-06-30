export type RfidScanEvent = Readonly<{
  deviceId: string
  rfidUid: string
  readerLocation: 'entry' | 'exit'
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

const readReaderLocation = (value: unknown): 'entry' | 'exit' | undefined => {
  if (value === 'entry' || value === 'exit') {
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
    throw new Error('RFID scan event must be an object')
  }

  if (isRecord(raw.payload)) {
    return raw.payload
  }

  return raw
}

export const parseRfidScanEvent = (raw: unknown): RfidScanEvent => {
  const record = unwrapPayload(raw)

  const rfidUid =
    readString(record, 'rfid_uid') ?? readString(record, 'rfidUid')
  const deviceId = readString(record, 'deviceId')
  const readerLocation = readReaderLocation(
    record.reader_location ?? record.readerLocation
  )

  if (!rfidUid) {
    throw new Error('rfid_uid is required')
  }

  if (!deviceId) {
    throw new Error('deviceId is required')
  }

  if (!readerLocation) {
    throw new Error('reader_location must be entry or exit')
  }

  return {
    deviceId,
    rfidUid,
    readerLocation,
    occurredAt: readTimestamp(record)
  }
}
