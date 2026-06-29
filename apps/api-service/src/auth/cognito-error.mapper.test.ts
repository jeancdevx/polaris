import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException
} from '@nestjs/common'
import { describe, expect, it } from 'vitest'

import { mapCognitoError } from './cognito-error.mapper.js'

describe('mapCognitoError', () => {
  it('maps UsernameExistsException to ConflictException', () => {
    expect(() =>
      mapCognitoError({
        name: 'UsernameExistsException',
        message: 'User already exists'
      })
    ).toThrow(ConflictException)
  })

  it('maps UserNotConfirmedException to ForbiddenException', () => {
    expect(() =>
      mapCognitoError({
        name: 'UserNotConfirmedException',
        message: 'User is not confirmed'
      })
    ).toThrow(ForbiddenException)
  })

  it('maps NotAuthorizedException to UnauthorizedException', () => {
    expect(() =>
      mapCognitoError({
        name: 'NotAuthorizedException',
        message: 'Incorrect username or password'
      })
    ).toThrow(UnauthorizedException)
  })
})
