import { ForbiddenException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'

import {
  parseAdminUserIdFromAuthorization,
  requireAdminAuthorization
} from './admin-auth.validation.js'

const adminTokenPayload = Buffer.from(
  JSON.stringify({
    preferred_username: 'usr-admin01',
    'cognito:groups': ['admin']
  })
).toString('base64url')

const userTokenPayload = Buffer.from(
  JSON.stringify({
    preferred_username: 'usr-12345',
    'cognito:groups': ['user']
  })
).toString('base64url')

const adminAuthorization = `Bearer header.${adminTokenPayload}.signature`
const userAuthorization = `Bearer header.${userTokenPayload}.signature`

describe('admin-auth.validation', () => {
  it('accepts tokens with admin group', () => {
    expect(() => requireAdminAuthorization(adminAuthorization)).not.toThrow()
  })

  it('rejects tokens without admin group', () => {
    expect(() => requireAdminAuthorization(userAuthorization)).toThrow(
      ForbiddenException
    )
  })

  it('parses preferred_username from admin token', () => {
    expect(parseAdminUserIdFromAuthorization(adminAuthorization)).toBe(
      'usr-admin01'
    )
  })
})
