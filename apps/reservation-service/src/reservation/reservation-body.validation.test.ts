import { describe, expect, it } from 'vitest'

import {
  parseCreateReserveBody,
  parseReservationIdParam,
  parseUserIdentity,
  parseUserIdFromJwt,
  parseUserIdHeader
} from './reservation-body.validation.js'

const idTokenPayload = Buffer.from(
  JSON.stringify({
    token_use: 'id',
    preferred_username: 'usr-12345',
    email: 'juan@example.com'
  })
).toString('base64url')

const sampleIdToken = `header.${idTokenPayload}.signature`

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

  it('reads preferred_username from Cognito idToken', () => {
    expect(parseUserIdFromJwt(`Bearer ${sampleIdToken}`)).toBe('usr-12345')
  })

  it('prefers X-User-Id header over JWT claim', () => {
    expect(
      parseUserIdentity('usr-from-header', `Bearer ${sampleIdToken}`)
    ).toBe('usr-from-header')
  })

  it('falls back to JWT when X-User-Id is missing', () => {
    expect(parseUserIdentity(undefined, `Bearer ${sampleIdToken}`)).toBe(
      'usr-12345'
    )
  })

  it('requires identity when header and JWT claim are missing', () => {
    expect(() => parseUserIdentity(undefined, undefined)).toThrow(
      'X-User-Id header is required'
    )
  })

  it('parses reservation id param', () => {
    expect(parseReservationIdParam('res-abc123')).toBe('res-abc123')
  })
})
