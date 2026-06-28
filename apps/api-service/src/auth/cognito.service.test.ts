import {
  GlobalSignOutCommand,
  InitiateAuthCommand,
  SignUpCommand,
  type CognitoIdentityProviderClient
} from '@aws-sdk/client-cognito-identity-provider'
import { ConfigService } from '@nestjs/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createCognitoClient } from './cognito-client.factory.js'
import { CognitoService } from './cognito.service.js'

vi.mock('./cognito-client.factory.js', () => ({
  createCognitoClient: vi.fn()
}))

const createConfigService = (): ConfigService =>
  new ConfigService({
    cognito: {
      userPoolId: 'us-east-2_testpool',
      clientId: 'test-client-id',
      region: 'us-east-2'
    }
  })

const createCognitoService = (
  send: ReturnType<typeof vi.fn>
): CognitoService => {
  const client = {
    send
  } as unknown as CognitoIdentityProviderClient

  vi.mocked(createCognitoClient).mockReturnValue(client)

  return new CognitoService(createConfigService())
}

describe('CognitoService', () => {
  beforeEach(() => {
    vi.mocked(createCognitoClient).mockReset()
  })

  it('signs up a user', async () => {
    const send = vi.fn().mockResolvedValue({
      UserSub: 'sub-123',
      CodeDeliveryDetails: {
        Destination: 'u***@example.com'
      }
    })

    const service = createCognitoService(send)
    const result = await service.signUp('user@example.com', 'Secret123!')

    expect(result).toEqual({
      userSub: 'sub-123',
      confirmationRequired: true,
      codeDeliveryDestination: 'u***@example.com'
    })
    expect(send).toHaveBeenCalledWith(expect.any(SignUpCommand))
  })

  it('signs in with user password auth', async () => {
    const send = vi.fn().mockResolvedValue({
      AuthenticationResult: {
        AccessToken: 'access-token',
        IdToken: 'id-token',
        RefreshToken: 'refresh-token',
        ExpiresIn: 3600
      }
    })

    const service = createCognitoService(send)
    const result = await service.signIn('user@example.com', 'Secret123!')

    expect(result).toEqual({
      accessToken: 'access-token',
      idToken: 'id-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer'
    })
    expect(send).toHaveBeenCalledWith(expect.any(InitiateAuthCommand))
  })

  it('refreshes tokens and preserves refresh token', async () => {
    const send = vi.fn().mockResolvedValue({
      AuthenticationResult: {
        AccessToken: 'new-access-token',
        IdToken: 'new-id-token',
        ExpiresIn: 3600
      }
    })

    const service = createCognitoService(send)
    const result = await service.refresh('existing-refresh-token')

    expect(result).toEqual({
      accessToken: 'new-access-token',
      idToken: 'new-id-token',
      refreshToken: 'existing-refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer'
    })
  })

  it('signs out globally', async () => {
    const send = vi.fn().mockResolvedValue({})

    const service = createCognitoService(send)
    await service.signOut('access-token')

    expect(send).toHaveBeenCalledWith(expect.any(GlobalSignOutCommand))
  })
})
