import type { ParkingSpotStatus } from '@polaris/shared-types'

export type OccupancyChangedIoTEvent = Readonly<{
  deviceId: string
  spotId: string
  status: ParkingSpotStatus
  sensorType: 'fc-51'
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

const readOccupancyStatus = (
  value: unknown
): Exclude<ParkingSpotStatus, 'reserved'> | undefined => {
  if (value === 'free' || value === 'occupied') {
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
    throw new Error('Occupancy event must be an object')
  }

  if (isRecord(raw.payload)) {
    return raw.payload
  }

  return raw
}

export const parseOccupancyChangedIoTEvent = (
  raw: unknown
): OccupancyChangedIoTEvent => {
  const record = unwrapPayload(raw)

  const spotId = readString(record, 'spotId')
  const deviceId = readString(record, 'deviceId')
  const status = readOccupancyStatus(record.status)
  const sensorType =
    record.sensorType === 'fc-51' || record.sensor_type === 'fc-51'
      ? 'fc-51'
      : undefined

  if (!spotId) {
    throw new Error('spotId is required')
  }

  if (!deviceId) {
    throw new Error('deviceId is required')
  }

  if (!status) {
    throw new Error('status must be free or occupied')
  }

  if (!sensorType) {
    throw new Error('sensorType must be fc-51')
  }

  return {
    deviceId,
    spotId,
    status,
    sensorType,
    occurredAt: readTimestamp(record)
  }
}
