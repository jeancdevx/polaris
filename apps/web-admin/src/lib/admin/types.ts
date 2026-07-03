import type { AuditLog, UserType } from '@polaris/shared-types'

export type AdminUserRole = 'admin' | 'user'

export type AdminUser = Readonly<{
  userId: string
  name: string
  email: string
  vehiclePlate: string
  rfidUid: string
  userType: UserType
  role: AdminUserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}>

export type AdminUserListResponse = Readonly<{
  users: AdminUser[]
  total: number
}>

export type CreateAdminUserBody = Readonly<{
  name: string
  email: string
  vehiclePlate: string
  rfidUid: string
  userType: UserType
  role: AdminUserRole
  password?: string
}>

export type CreateAdminUserResponse = AdminUser &
  Readonly<{
    temporaryPassword?: string
  }>

export type AuditLogListResponse = Readonly<{
  items: AuditLog[]
  page: number
  limit: number
  total: number
  totalPages: number
}>

export type AuditLogFilters = Readonly<{
  page?: number
  limit?: number
  eventType?: string
  userId?: string
  parkingSpotId?: string
  gate?: string
  userType?: UserType
  from?: string
  to?: string
}>

export type AdminMetricsResponse = Readonly<{
  generatedAt: string
  range: {
    from: string
    to: string
  }
  occupancy: {
    totalSpots: number
    totalAvailable: number
    totalOccupied: number
    totalReserved: number
    zones: ReadonlyArray<{
      zone: string
      totalSpots: number
      totalAvailable: number
      totalOccupied: number
      totalReserved: number
    }>
  }
  reservations: {
    active: number
    checkedIn: number
    cancelledInRange: number
    expiredInRange: number
  }
  users: {
    active: number
    inactive: number
  }
  audit: {
    totalInRange: number
    byEventType: Record<string, number>
  }
}>

export type MetricsFilters = Readonly<{
  zone?: 'a' | 'b'
  from?: string
  to?: string
}>
