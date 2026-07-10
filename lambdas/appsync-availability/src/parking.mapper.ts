import type { ParkingSpotRow } from '@polaris/database'
import type {
  ParkingSpot,
  ParkingSpotStatus,
  ParkingStatus
} from '@polaris/shared-types'

const isParkingSpotStatus = (value: string): value is ParkingSpotStatus =>
  value === 'free' || value === 'occupied' || value === 'reserved'

export const occupiedSinceToSeconds = (
  value: Date | string | undefined | null
): number | undefined => {
  if (value == null) {
    return undefined
  }

  if (value instanceof Date) {
    return Math.floor(value.getTime() / 1000)
  }

  const raw = Number.parseInt(value, 10)

  if (!Number.isFinite(raw)) {
    return undefined
  }

  return raw > 9_999_999_999 ? Math.floor(raw / 1000) : raw
}

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
    occupiedSince: occupiedSinceToSeconds(hash.occupiedSince)
  }
}

export const mapParkingSpotRow = (row: ParkingSpotRow): ParkingSpot => ({
  spotId: row.spotId,
  zone: row.zone,
  status: row.status,
  userId: row.userId,
  reservationId: row.reservationId,
  occupiedSince: occupiedSinceToSeconds(row.occupiedSince)
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
