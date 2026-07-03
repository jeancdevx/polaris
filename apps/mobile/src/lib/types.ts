/**
 * Tipos espejo de @polaris/shared-types. Se duplican localmente para no
 * arrastrar dist ESM de workspace packages a través de Metro.
 */
export type ParkingSpotStatus = 'free' | 'occupied' | 'reserved'

export type ParkingSpot = Readonly<{
  spotId: string
  status: ParkingSpotStatus
  zone: string
  userId?: string
  vehiclePlate?: string
  reservationId?: string
  occupiedSince?: number
}>

export type ParkingStatus = Readonly<{
  totalSpots: number
  totalAvailable: number
  totalOccupied: number
  totalReserved: number
  totalVisitors: number
  spots: ParkingSpot[]
  updatedAt: string
}>

export type ReservationStatus =
  | 'active'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'expired'

export type Reservation = Readonly<{
  reservationId: string
  userId: string
  parkingSpotId: string
  status: ReservationStatus
  reservationDate: string
  createdAt: string
  expiresAt: string
}>

export type AuthTokens = Readonly<{
  accessToken: string
  idToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}>
