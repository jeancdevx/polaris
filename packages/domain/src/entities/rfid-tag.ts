import type { UserType } from '@polaris/shared-types'

import { businessRuleViolation } from '../errors/domain-error.js'

import type { UserId } from '../value-objects/entity-id.js'
import type { RfidUid } from '../value-objects/rfid-uid.js'
import type { VehiclePlate } from '../value-objects/vehicle-plate.js'

export type RfidTag = Readonly<{
  rfidUid: RfidUid
  userId: UserId
  userType: UserType
  vehiclePlate: VehiclePlate
  isActive: boolean
  validUntil?: Date
  createdAt: Date
}>

export type CreateRfidTagInput = {
  rfidUid: RfidUid
  userId: UserId
  vehiclePlate: VehiclePlate
  userType?: UserType
  validUntil?: Date
  createdAt?: Date
}

export const createRfidTag = (input: CreateRfidTagInput): RfidTag => ({
  rfidUid: input.rfidUid,
  userId: input.userId,
  userType: input.userType ?? 'registered',
  vehiclePlate: input.vehiclePlate,
  isActive: true,
  validUntil: input.validUntil,
  createdAt: input.createdAt ?? new Date()
})

export const restoreRfidTag = (tag: RfidTag): RfidTag => ({ ...tag })

export const isRfidTagValid = (
  tag: RfidTag,
  at: Date = new Date()
): boolean => {
  if (!tag.isActive) {
    return false
  }
  if (tag.validUntil && at >= tag.validUntil) {
    return false
  }
  return true
}

export const deactivateRfidTag = (tag: RfidTag): RfidTag => ({
  ...tag,
  isActive: false
})

export const activateRfidTag = (tag: RfidTag): RfidTag => ({
  ...tag,
  isActive: true
})

export const validateRfidTagForEntry = (
  tag: RfidTag,
  at: Date = new Date()
): void => {
  if (!isRfidTagValid(tag, at)) {
    businessRuleViolation(
      'RFID_NOT_VALID',
      `RFID ${tag.rfidUid.value} is not valid for entry`
    )
  }
}
