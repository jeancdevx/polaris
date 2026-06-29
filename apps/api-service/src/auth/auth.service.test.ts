import { BadRequestException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'

import { AuthService } from './auth.service.js'
import type { CognitoService } from './cognito.service.js'

const createAuthService = (): {
  authService: AuthService
  cognitoService: CognitoService
} => {
  const cognitoService = {
    signIn: vi.fn(),
    refresh: vi.fn(),
    signOut: vi.fn()
  } as unknown as CognitoService

  return {
    authService: new AuthService(cognitoService),
    cognitoService
  }
}

describe('AuthService', () => {
  it('delegates signin to CognitoService', async () => {
    const { authService, cognitoService } = createAuthService()

    vi.mocked(cognitoService.signIn).mockResolvedValue({
      accessToken: 'access',
      idToken: 'id',
      refreshToken: 'refresh',
      expiresIn: 3600,
      tokenType: 'Bearer'
    })

    await expect(
      authService.signIn({
        email: 'user@example.com',
        password: 'Secret123!'
      })
    ).resolves.toMatchObject({
      accessToken: 'access',
      tokenType: 'Bearer'
    })
  })

  it('requires access token for logout', async () => {
    const { authService } = createAuthService()

    await expect(authService.logout({}, undefined)).rejects.toThrow(
      BadRequestException
    )
  })

  it('delegates logout with bearer token', async () => {
    const { authService, cognitoService } = createAuthService()

    vi.mocked(cognitoService.signOut).mockResolvedValue(undefined)

    await expect(
      authService.logout({}, 'Bearer access-token')
    ).resolves.toEqual({
      message: 'Signed out successfully'
    })

    expect(cognitoService.signOut).toHaveBeenCalledWith('access-token')
  })
})
