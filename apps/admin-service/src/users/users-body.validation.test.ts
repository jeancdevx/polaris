import { BadRequestException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'

import {
  parseCreateAdminUserBody,
  parseIncludeInactiveQuery,
  parseUpdateAdminUserBody
} from './users-body.validation.js'

describe('users-body.validation', () => {
  it('parses create body with defaults', () => {
    expect(
      parseCreateAdminUserBody({
        name: 'Jane Admin',
        email: 'Jane@Example.com',
        vehiclePlate: 'abc-999',
        rfidUid: 'a1:b2:c3:d4'
      })
    ).toEqual({
      name: 'Jane Admin',
      email: 'jane@example.com',
      vehiclePlate: 'ABC-999',
      rfidUid: 'A1:B2:C3:D4',
      userType: 'registered',
      role: 'user',
      password: undefined
    })
  })

  it('rejects invalid rfid uid', () => {
    expect(() =>
      parseCreateAdminUserBody({
        name: 'Jane Admin',
        email: 'jane@example.com',
        vehiclePlate: 'ABC-999',
        rfidUid: 'bad'
      })
    ).toThrow(BadRequestException)
  })

  it('requires at least one update field', () => {
    expect(() => parseUpdateAdminUserBody({})).toThrow(BadRequestException)
  })

  it('parses includeInactive query', () => {
    expect(parseIncludeInactiveQuery('true')).toBe(true)
    expect(parseIncludeInactiveQuery(undefined)).toBe(false)
  })
})
