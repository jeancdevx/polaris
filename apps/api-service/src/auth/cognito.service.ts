import {
  GlobalSignOutCommand,
  InitiateAuthCommand,
  type AuthenticationResultType,
  type CognitoIdentityProviderClient
} from '@aws-sdk/client-cognito-identity-provider'
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { AuthTokensResponse } from './types/auth.types.js'

import { createCognitoClient } from './cognito-client.factory.js'
import { mapCognitoError } from './cognito-error.mapper.js'
import { COGNITO_CONFIG_KEY, type CognitoConfig } from './cognito.config.js'

@Injectable()
export class CognitoService {
  private readonly config: CognitoConfig
  private readonly client: CognitoIdentityProviderClient

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<CognitoConfig>(COGNITO_CONFIG_KEY)
    this.client = createCognitoClient({
      region: this.config.region
    })
  }

  private assertConfigured(): void {
    if (!this.config.userPoolId || !this.config.clientId) {
      throw new InternalServerErrorException(
        'COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID must be configured'
      )
    }
  }

  async signIn(email: string, password: string): Promise<AuthTokensResponse> {
    this.assertConfigured()

    try {
      const output = await this.client.send(
        new InitiateAuthCommand({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: this.config.clientId,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password
          }
        })
      )

      return this.toAuthTokens(output.AuthenticationResult)
    } catch (error) {
      return mapCognitoError(error)
    }
  }

  async refresh(refreshToken: string): Promise<AuthTokensResponse> {
    this.assertConfigured()

    try {
      const output = await this.client.send(
        new InitiateAuthCommand({
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          ClientId: this.config.clientId,
          AuthParameters: {
            REFRESH_TOKEN: refreshToken
          }
        })
      )

      const tokens = this.toAuthTokens(
        output.AuthenticationResult,
        refreshToken
      )

      return tokens
    } catch (error) {
      return mapCognitoError(error)
    }
  }

  async signOut(accessToken: string): Promise<void> {
    this.assertConfigured()

    try {
      await this.client.send(
        new GlobalSignOutCommand({
          AccessToken: accessToken
        })
      )
    } catch (error) {
      return mapCognitoError(error)
    }
  }

  private toAuthTokens(
    result: AuthenticationResultType | undefined,
    fallbackRefreshToken?: string
  ): AuthTokensResponse {
    const refreshToken = result?.RefreshToken ?? fallbackRefreshToken

    if (
      !result?.AccessToken ||
      !result.IdToken ||
      !refreshToken ||
      result.ExpiresIn === undefined
    ) {
      throw new Error('Cognito did not return a complete authentication result')
    }

    return {
      accessToken: result.AccessToken,
      idToken: result.IdToken,
      refreshToken,
      expiresIn: result.ExpiresIn,
      tokenType: 'Bearer'
    }
  }
}
