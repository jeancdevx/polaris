import { BadRequestException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'

import {
  parseBearerAccessToken,
  parseLogoutBody,
  parseRefreshBody,
  parseSigninBody
} from './auth-body.validation.js'

describe('auth body validation', () => {
  it('parses signin body', () => {
    expect(
      parseSigninBody({
        email: 'User@Example.com',
        password: 'Secret123!'
      })
    ).toEqual({
      email: 'user@example.com',
      password: 'Secret123!'
    })
  })

  it('parses refresh body', () => {
    expect(
      parseRefreshBody({
        refreshToken: 'refresh-token'
      })
    ).toEqual({
      refreshToken: 'refresh-token'
    })
  })

  it('parses logout body access token', () => {
    expect(
      parseLogoutBody({
        accessToken: 'access-token'
      })
    ).toEqual({
      accessToken: 'access-token'
    })
  })

  it('parses bearer authorization header', () => {
    expect(parseBearerAccessToken('Bearer access-token')).toBe('access-token')
  })

  it('rejects invalid bearer authorization header', () => {
    expect(() => parseBearerAccessToken('Token access-token')).toThrow(
      BadRequestException
    )
  })
})
