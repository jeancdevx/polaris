import type { UserType } from '@polaris/shared-types'

import { businessRuleViolation } from '../errors/domain-error.js'

import type { Email } from '../value-objects/email.js'
import type { UserId } from '../value-objects/entity-id.js'
import type { RfidUid } from '../value-objects/rfid-uid.js'
import type { VehiclePlate } from '../value-objects/vehicle-plate.js'

export type User = Readonly<{
  userId: UserId
  name: string
  email: Email
  vehiclePlate: VehiclePlate
  rfidUid: RfidUid
  userType: UserType
  isActive: boolean
  createdAt: Date
}>

export type CreateUserInput = {
  userId: UserId
  name: string
  email: Email
  vehiclePlate: VehiclePlate
  rfidUid: RfidUid
  userType?: UserType
  createdAt?: Date
}

const normalizeUserName = (name: string): string => {
  const trimmed = name.trim()
  if (trimmed.length < 2) {
    businessRuleViolation(
      'INVALID_USER_NAME',
      'User name must have at least 2 characters'
    )
  }
  return trimmed
}

export const createUser = (input: CreateUserInput): User => ({
  userId: input.userId,
  name: normalizeUserName(input.name),
  email: input.email,
  vehiclePlate: input.vehiclePlate,
  rfidUid: input.rfidUid,
  userType: input.userType ?? 'registered',
  isActive: true,
  createdAt: input.createdAt ?? new Date()
})

export const restoreUser = (user: User): User => ({ ...user })

export const updateUserProfile = (
  user: User,
  name: string,
  vehiclePlate: VehiclePlate
): User => ({
  ...user,
  name: normalizeUserName(name),
  vehiclePlate
})

export const deactivateUser = (user: User): User => ({
  ...user,
  isActive: false
})

export const activateUser = (user: User): User => ({
  ...user,
  isActive: true
})

export const canUserAuthenticate = (user: User): boolean => user.isActive
