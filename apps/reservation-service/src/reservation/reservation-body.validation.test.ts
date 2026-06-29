import { describe, expect, it } from 'vitest'

import {
  parseCreateReserveBody,
  parseReservationIdParam,
  parseUserIdHeader
} from './reservation-body.validation.js'

describe('reservation body validation', () => {
  it('parses a valid reserve body', () => {
    expect(
      parseCreateReserveBody({
        parkingSpotId: 'spot-07',
        reservationDate: '2025-06-19T14:00:00.000Z'
      })
    ).toEqual({
      parkingSpotId: 'spot-07',
      reservationDate: '2025-06-19T14:00:00.000Z'
    })
  })

  it('requires X-User-Id header', () => {
    expect(() => parseUserIdHeader(undefined)).toThrow(
      'X-User-Id header is required'
    )
  })

  it('parses reservation id param', () => {
    expect(parseReservationIdParam('res-abc123')).toBe('res-abc123')
  })
})
