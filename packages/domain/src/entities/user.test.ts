import { describe, expect, it } from 'vitest'

import { isBusinessRuleViolationError } from '../errors/domain-error.js'

import { createEmail } from '../value-objects/email.js'
import { createUserId } from '../value-objects/entity-id.js'
import { createRfidUid } from '../value-objects/rfid-uid.js'
import { createVehiclePlate } from '../value-objects/vehicle-plate.js'

import {
  activateRfidTag,
  activateUser,
  canUserAuthenticate,
  createRfidTag,
  createUser,
  deactivateRfidTag,
  deactivateUser,
  isRfidTagValid,
  updateUserProfile,
  validateRfidTagForEntry
} from '../index.js'

const buildUser = () =>
  createUser({
    userId: createUserId('usr-12345'),
    name: 'Juan Perez',
    email: createEmail('juan@example.com'),
    vehiclePlate: createVehiclePlate('ABC-1234'),
    rfidUid: createRfidUid('A3:BF:22:01')
  })

const expectBusinessRuleViolation = (action: () => void): void => {
  try {
    action()
    expect.fail('expected business rule violation')
  } catch (error) {
    expect(isBusinessRuleViolationError(error)).toBe(true)
  }
}

describe('User', () => {
  it('creates an active registered user', () => {
    const user = buildUser()
    expect(user.isActive).toBe(true)
    expect(canUserAuthenticate(user)).toBe(true)
    expect(user.userType).toBe('registered')
  })

  it('updates profile data', () => {
    const updated = updateUserProfile(
      buildUser(),
      'Maria Lopez',
      createVehiclePlate('XYZ-9999')
    )
    expect(updated.name).toBe('Maria Lopez')
    expect(updated.vehiclePlate.value).toBe('XYZ-9999')
  })

  it('deactivates and reactivates', () => {
    const inactive = deactivateUser(buildUser())
    expect(canUserAuthenticate(inactive)).toBe(false)
    expect(canUserAuthenticate(activateUser(inactive))).toBe(true)
  })

  it('rejects short names', () => {
    expectBusinessRuleViolation(() =>
      createUser({
        userId: createUserId('usr-99999'),
        name: 'A',
        email: createEmail('a@b.com'),
        vehiclePlate: createVehiclePlate('ABC-1234'),
        rfidUid: createRfidUid('A1:B2:C3:D4')
      })
    )
  })
})

describe('RfidTag', () => {
  it('validates active tags', () => {
    const tag = createRfidTag({
      rfidUid: createRfidUid('A3:BF:22:01'),
      userId: createUserId('usr-12345'),
      vehiclePlate: createVehiclePlate('ABC-1234')
    })
    expect(isRfidTagValid(tag)).toBe(true)
    expect(() => validateRfidTagForEntry(tag)).not.toThrow()
  })

  it('rejects deactivated tags', () => {
    const tag = deactivateRfidTag(
      createRfidTag({
        rfidUid: createRfidUid('A3:BF:22:01'),
        userId: createUserId('usr-12345'),
        vehiclePlate: createVehiclePlate('ABC-1234')
      })
    )
    expectBusinessRuleViolation(() => validateRfidTagForEntry(tag))
  })

  it('rejects expired tags', () => {
    const tag = createRfidTag({
      rfidUid: createRfidUid('A3:BF:22:01'),
      userId: createUserId('usr-12345'),
      vehiclePlate: createVehiclePlate('ABC-1234'),
      validUntil: new Date('2025-01-01T00:00:00.000Z')
    })
    expect(isRfidTagValid(tag, new Date('2025-06-19T00:00:00.000Z'))).toBe(
      false
    )
  })

  it('reactivates tags', () => {
    const active = activateRfidTag(
      deactivateRfidTag(
        createRfidTag({
          rfidUid: createRfidUid('A1:B2:C3:D4'),
          userId: createUserId('usr-12345'),
          vehiclePlate: createVehiclePlate('ABC-1234')
        })
      )
    )
    expect(active.isActive).toBe(true)
  })
})
