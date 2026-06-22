import { describe, expect, it } from 'vitest'

import { isBusinessRuleViolationError } from '../errors/domain-error.js'

import {
  createReservationId,
  createUserId
} from '../value-objects/entity-id.js'
import { createSpotId } from '../value-objects/spot-id.js'

import {
  cancelReservation,
  canValidateReservationEntry,
  checkInReservation,
  checkOutReservation,
  createReservation,
  expireReservation
} from './reservation.js'

const baseDate = new Date('2025-06-19T10:00:00.000Z')
const expiresAt = new Date('2025-06-19T12:00:00.000Z')

const buildReservation = () =>
  createReservation({
    reservationId: createReservationId('res-001'),
    userId: createUserId('usr-12345'),
    parkingSpotId: createSpotId('spot-03'),
    reservationDate: baseDate,
    expiresAt,
    createdAt: baseDate
  })

const expectBusinessRuleViolation = (action: () => void): void => {
  try {
    action()
    expect.fail('expected business rule violation')
  } catch (error) {
    expect(isBusinessRuleViolationError(error)).toBe(true)
  }
}

describe('Reservation', () => {
  it('creates an active reservation', () => {
    const reservation = buildReservation()
    expect(reservation.status).toBe('active')
    expect(canValidateReservationEntry(reservation, baseDate)).toBe(true)
  })

  it('checks in an active reservation', () => {
    const checkedIn = checkInReservation(
      buildReservation(),
      new Date('2025-06-19T10:30:00.000Z')
    )
    expect(checkedIn.status).toBe('checked_in')
    expect(checkedIn.checkedInAt).toBeInstanceOf(Date)
  })

  it('checks out a checked-in reservation', () => {
    const completed = checkOutReservation(
      checkInReservation(
        buildReservation(),
        new Date('2025-06-19T10:30:00.000Z')
      ),
      new Date('2025-06-19T11:30:00.000Z')
    )
    expect(completed.status).toBe('completed')
  })

  it('cancels an active reservation', () => {
    const cancelled = cancelReservation(buildReservation())
    expect(cancelled.status).toBe('cancelled')
  })

  it('expires an active reservation after expiresAt', () => {
    const expired = expireReservation(
      buildReservation(),
      new Date('2025-06-19T12:01:00.000Z')
    )
    expect(expired.status).toBe('expired')
  })

  it('rejects entry when expired', () => {
    expect(
      canValidateReservationEntry(
        buildReservation(),
        new Date('2025-06-19T13:00:00.000Z')
      )
    ).toBe(false)
  })

  it('rejects check-in when not active', () => {
    expectBusinessRuleViolation(() =>
      checkInReservation(cancelReservation(buildReservation()))
    )
  })

  it('rejects expire before expiresAt', () => {
    expectBusinessRuleViolation(() =>
      expireReservation(buildReservation(), baseDate)
    )
  })

  it('rejects invalid expiration on create', () => {
    expectBusinessRuleViolation(() =>
      createReservation({
        reservationId: createReservationId('res-002'),
        userId: createUserId('usr-12345'),
        parkingSpotId: createSpotId('spot-01'),
        reservationDate: expiresAt,
        expiresAt: baseDate
      })
    )
  })
})
