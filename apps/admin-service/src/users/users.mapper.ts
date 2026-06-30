import type { UserRow } from '@polaris/database'

import type { AdminUserResponse } from './users.types.js'

export const mapUserRowToResponse = (row: UserRow): AdminUserResponse => ({
  userId: row.userId,
  name: row.name,
  email: row.email,
  vehiclePlate: row.vehiclePlate,
  rfidUid: row.rfidUid,
  userType: row.userType,
  role: row.role,
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString()
})
