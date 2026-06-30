import type { ParkingSpotRow } from '@polaris/database'
import type {
  ParkingSpot,
  ParkingSpotStatus,
  ParkingStatus
} from '@polaris/shared-types'

const isParkingSpotStatus = (value: string): value is ParkingSpotStatus =>
  value === 'free' || value === 'occupied' || value === 'reserved'

export const parkingZoneFromSpotId = (spotId: string): string => {
  const spotNumber = Number.parseInt(spotId.replace('spot-', ''), 10)
  return spotNumber <= 5 ? 'a' : 'b'
}

export const mapRedisHashToParkingSpot = (
  spotId: string,
  hash: Record<string, string>
): ParkingSpot | undefined => {
  const status = hash.status

  if (!status || !isParkingSpotStatus(status)) {
    return undefined
  }

  return {
    spotId,
    zone: parkingZoneFromSpotId(spotId),
    status,
    userId: hash.userId,
    reservationId: hash.reservationId,
    occupiedSince: hash.occupiedSince
      ? Number.parseInt(hash.occupiedSince, 10)
      : undefined
  }
}

export const mapParkingSpotRow = (row: ParkingSpotRow): ParkingSpot => ({
  spotId: row.spotId,
  zone: row.zone,
  status: row.status,
  userId: row.userId,
  reservationId: row.reservationId,
  occupiedSince: row.occupiedSince?.getTime()
})

export const buildParkingStatus = (spots: ParkingSpot[]): ParkingStatus => {
  const sortedSpots = [...spots].sort((left, right) =>
    left.spotId.localeCompare(right.spotId)
  )

  return {
    totalSpots: sortedSpots.length,
    totalAvailable: sortedSpots.filter(spot => spot.status === 'free').length,
    totalOccupied: sortedSpots.filter(spot => spot.status === 'occupied')
      .length,
    totalReserved: sortedSpots.filter(spot => spot.status === 'reserved')
      .length,
    totalVisitors: 0,
    spots: sortedSpots,
    updatedAt: new Date().toISOString()
  }
}

export type ZoneOccupancySummary = Readonly<{
  zone: string
  totalSpots: number
  totalAvailable: number
  totalOccupied: number
  totalReserved: number
}>

export const buildZoneSummaries = (
  spots: ParkingSpot[]
): ZoneOccupancySummary[] => {
  const zones = new Map<string, ParkingSpot[]>()

  for (const spot of spots) {
    const current = zones.get(spot.zone) ?? []
    current.push(spot)
    zones.set(spot.zone, current)
  }

  return [...zones.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([zone, zoneSpots]) => ({
      zone,
      totalSpots: zoneSpots.length,
      totalAvailable: zoneSpots.filter(spot => spot.status === 'free').length,
      totalOccupied: zoneSpots.filter(spot => spot.status === 'occupied')
        .length,
      totalReserved: zoneSpots.filter(spot => spot.status === 'reserved').length
    }))
}
