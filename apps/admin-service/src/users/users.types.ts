import type { UserRole, UserRow } from '@polaris/database'
import type { UserType } from '@polaris/shared-types'

export type AdminUserResponse = Readonly<{
  userId: string
  name: string
  email: string
  vehiclePlate: string
  rfidUid: string
  userType: UserType
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}>

export type CreateAdminUserResponse = AdminUserResponse &
  Readonly<{
    temporaryPassword?: string
  }>

export type AdminUserListResponse = Readonly<{
  users: AdminUserResponse[]
  total: number
}>

export type PersistedAdminUser = UserRow
