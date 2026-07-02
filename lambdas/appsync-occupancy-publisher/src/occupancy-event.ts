import type { ParkingSpotStatus } from '@polaris/shared-types'

export const parkingZoneFromSpotId = (spotId: string): string => {
  const spotNumber = Number.parseInt(spotId.replace('spot-', ''), 10)
  return spotNumber <= 5 ? 'a' : 'b'
}

const isParkingSpotStatus = (value: string): value is ParkingSpotStatus =>
  value === 'free' || value === 'occupied' || value === 'reserved'

export type OccupancyPublisherEvent = Readonly<{
  detailType: string
  source: string
  parkingSpotId: string
  previousStatus: ParkingSpotStatus
  currentStatus: ParkingSpotStatus
  occurredAt: string
  deviceId?: string
  sensorType?: string
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

  return {}
}

const readString = (
  record: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = record[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export const parseOccupancyPublisherEvent = (
  raw: unknown
): OccupancyPublisherEvent => {
  if (!isRecord(raw)) {
    throw new Error('Occupancy publisher event must be an object')
  }

  const detailType =
    typeof raw['detail-type'] === 'string'
      ? raw['detail-type']
      : typeof raw.detailType === 'string'
        ? raw.detailType
        : undefined

  const source = typeof raw.source === 'string' ? raw.source : 'unknown'
  const detail = readDetail(raw.detail ?? raw)

  if (detailType !== 'sensor.occupancy') {
    throw new Error(`Unsupported detail-type: ${detailType ?? 'unknown'}`)
  }

  const parkingSpotId = readString(detail, 'parkingSpotId')
  const previousStatus = readString(detail, 'previousStatus')
  const currentStatus = readString(detail, 'currentStatus')
  const occurredAt =
    readString(detail, 'occurredAt') ??
    readString(detail, 'processedAt') ??
    new Date().toISOString()

  if (!parkingSpotId) {
    throw new Error('parkingSpotId is required')
  }

  if (!previousStatus || !isParkingSpotStatus(previousStatus)) {
    throw new Error('previousStatus is required')
  }

  if (!currentStatus || !isParkingSpotStatus(currentStatus)) {
    throw new Error('currentStatus is required')
  }

  return {
    detailType,
    source,
    parkingSpotId,
    previousStatus,
    currentStatus,
    occurredAt,
    deviceId: readString(detail, 'deviceId'),
    sensorType: readString(detail, 'sensorType')
  }
}

export type OccupancyChangedInput = Readonly<{
  spotId: string
  zone: string
  status: ParkingSpotStatus
  previousStatus: ParkingSpotStatus
  deviceId?: string
  sensorType?: string
  occurredAt: string
}>

export const buildOccupancyChangedInput = (
  event: OccupancyPublisherEvent
): OccupancyChangedInput => ({
  spotId: event.parkingSpotId,
  zone: parkingZoneFromSpotId(event.parkingSpotId),
  status: event.currentStatus,
  previousStatus: event.previousStatus,
  deviceId: event.deviceId,
  sensorType: event.sensorType,
  occurredAt: event.occurredAt
})
