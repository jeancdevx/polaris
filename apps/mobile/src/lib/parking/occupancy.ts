import type { ParkingSpot, ParkingSpotStatus, ParkingStatus } from '@/lib/types'

export type OccupancyChangedEvent = Readonly<{
  spotId: string
  zone: string
  status: ParkingSpotStatus
  previousStatus?: ParkingSpotStatus | null
  deviceId?: string | null
  sensorType?: string | null
  occurredAt: string
}>

export const parkingZoneFromSpotId = (spotId: string): string => {
  const spotNumber = Number.parseInt(spotId.replace('spot-', ''), 10)
  return spotNumber <= 5 ? 'a' : 'b'
}

export const mergeOccupancyChange = (
  current: ParkingStatus,
  change: OccupancyChangedEvent
): ParkingStatus => {
  const spots = current.spots.map(spot =>
    spot.spotId === change.spotId
      ? {
          ...spot,
          status: change.status,
          ...(change.status === 'free'
            ? { userId: undefined, reservationId: undefined }
            : {})
        }
      : spot
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

export const findMyReservedSpot = (
  status: ParkingStatus | null,
  userId: string | null
): ParkingSpot | undefined => {
  if (!status || !userId) {
    return undefined
  }

  return status.spots.find(
    spot =>
      spot.userId === userId &&
      (spot.status === 'reserved' || spot.status === 'occupied')
  )
}

export const statusLabel: Record<ParkingSpotStatus, string> = {
  free: 'Libre',
  occupied: 'Ocupada',
  reserved: 'Reservada'
}
