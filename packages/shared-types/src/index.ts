export const KAFKA_TOPICS = {
  VEHICLE_ENTRY: 'vehicle.entry',
  VEHICLE_EXIT: 'vehicle.exit',
  SENSOR_OCCUPANCY: 'sensor.occupancy',
  SENSOR_PROXIMITY: 'sensor.proximity',
  RESERVATION_CREATED: 'reservation.created',
  RESERVATION_CANCELLED: 'reservation.cancelled',
  RFID_VALIDATION: 'rfid.validation',
  AUDIT_EVENTS: 'audit.events'
} as const

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS]

export type ParkingSpotStatus = 'free' | 'occupied' | 'reserved'

export type UserType = 'registered' | 'visitor'

export type ReservationStatus =
  | 'active'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'expired'

export interface ParkingSpot {
  spotId: string
  status: ParkingSpotStatus
  zone: string
  userId?: string
  vehiclePlate?: string
  reservationId?: string
  occupiedSince?: number
}

export interface ParkingStatus {
  totalSpots: number
  totalAvailable: number
  totalOccupied: number
  totalReserved: number
  totalVisitors: number
  spots: ParkingSpot[]
  updatedAt: string
}

export interface User {
  userId: string
  name: string
  email: string
  vehiclePlate: string
  rfidUid: string
  isActive: boolean
  createdAt: string
}

export interface Reservation {
  reservationId: string
  userId: string
  parkingSpotId: string
  status: ReservationStatus
  reservationDate: string
  createdAt: string
  expiresAt: string
  checkedInAt?: string
  checkedOutAt?: string
  cancelledAt?: string
  expiredAt?: string
}

export interface AuditLog {
  logId: string
  eventType: string
  userId?: string
  userType?: UserType
  vehiclePlate?: string
  parkingSpotId?: string
  gate?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface RfidValidation {
  rfidUid: string
  userId: string
  userType: UserType
  isActive: boolean
  vehiclePlate: string
  validUntil?: string
  createdAt: string
}
