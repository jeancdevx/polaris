import type { ParkingSpotStatus } from '@polaris/shared-types'
import { formatTimestamp } from '@polaris/shared-utils'

export type ProcessedParkingEventDetail = Readonly<{
  eventName: string
  aggregateId: string
  occurredAt: string
  processedAt: string
  parkingSpotId: string
  previousStatus: ParkingSpotStatus
  currentStatus: ParkingSpotStatus
  userId?: string
  reservationId?: string
  vehiclePlate?: string
  deviceId?: string
  sensorType?: string
}>

export const buildProcessedParkingEventDetail = (input: {
  eventName: string
  aggregateId: string
  occurredAt: string
  parkingSpotId: string
  previousStatus: ParkingSpotStatus
  currentStatus: ParkingSpotStatus
  processedAt?: Date
  userId?: string
  reservationId?: string
  vehiclePlate?: string
  deviceId?: string
  sensorType?: string
}): ProcessedParkingEventDetail => ({
  eventName: input.eventName,
  aggregateId: input.aggregateId,
  occurredAt: input.occurredAt,
  processedAt: formatTimestamp(input.processedAt ?? new Date()),
  parkingSpotId: input.parkingSpotId,
  previousStatus: input.previousStatus,
  currentStatus: input.currentStatus,
  userId: input.userId,
  reservationId: input.reservationId,
  vehiclePlate: input.vehiclePlate,
  deviceId: input.deviceId,
  sensorType: input.sensorType
})
