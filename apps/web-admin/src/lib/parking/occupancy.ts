import type { ParkingSpotStatus, ParkingStatus } from '@polaris/shared-types'

export type OccupancyChangedEvent = Readonly<{
  spotId: string
  zone: string
  status: ParkingSpotStatus
  previousStatus?: ParkingSpotStatus | null
  deviceId?: string | null
  sensorType?: string | null
  occurredAt: string
}>

export const mergeOccupancyChange = (
  current: ParkingStatus,
  change: OccupancyChangedEvent
): ParkingStatus => {
  const spots = current.spots.map(spot =>
    spot.spotId === change.spotId ? { ...spot, status: change.status } : spot
  )

  return {
    ...current,
    spots,
    totalAvailable: spots.filter(spot => spot.status === 'free').length,
    totalOccupied: spots.filter(spot => spot.status === 'occupied').length,
    totalReserved: spots.filter(spot => spot.status === 'reserved').length,
    updatedAt: change.occurredAt
  }
}
