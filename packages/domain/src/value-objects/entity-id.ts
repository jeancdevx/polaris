import { invalidValue } from '../errors/domain-error.js'

const ID_PATTERN = /^[a-z]+-[a-z0-9-]+$/

const validateEntityId = (
  prefix: string,
  raw: string,
  field: string
): string => {
  const normalized = raw.trim()
  const expectedPrefix = `${prefix}-`
  if (!normalized.startsWith(expectedPrefix) || !ID_PATTERN.test(normalized)) {
    invalidValue(field, raw)
  }
  return normalized
}

export type UserId = Readonly<{
  value: string
}>

export type ReservationId = Readonly<{
  value: string
}>

export const createUserId = (raw: string): UserId => ({
  value: validateEntityId('usr', raw, 'UserId')
})

export const createReservationId = (raw: string): ReservationId => ({
  value: validateEntityId('res', raw, 'ReservationId')
})

export const userIdEquals = (left: UserId, right: UserId): boolean =>
  left.value === right.value

export const reservationIdEquals = (
  left: ReservationId,
  right: ReservationId
): boolean => left.value === right.value
