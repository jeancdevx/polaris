import { BadRequestException, Injectable } from '@nestjs/common'

import {
  parseBearerAccessToken,
  parseLogoutBody,
  parseRefreshBody,
  parseSigninBody,
  parseSignupBody
} from './auth-body.validation.js'
import { CognitoService } from './cognito.service.js'
import type {
  AuthTokensResponse,
  MessageResponse,
  SignupResponse
} from './types/auth.types.js'

@Injectable()
export class AuthService {
  constructor(private readonly cognitoService: CognitoService) {}

  signUp(body: unknown): Promise<SignupResponse> {
    const { email, password } = parseSignupBody(body)
    return this.cognitoService.signUp(email, password)
  }

  signIn(body: unknown): Promise<AuthTokensResponse> {
    const { email, password } = parseSigninBody(body)
    return this.cognitoService.signIn(email, password)
  }

  refresh(body: unknown): Promise<AuthTokensResponse> {
    const { refreshToken } = parseRefreshBody(body)
    return this.cognitoService.refresh(refreshToken)
  }

  async logout(
    body: unknown,
    authorizationHeader: string | undefined
  ): Promise<MessageResponse> {
    const parsedBody = parseLogoutBody(body)
    const bearerToken = parseBearerAccessToken(authorizationHeader)
    const accessToken = bearerToken ?? parsedBody.accessToken

    if (!accessToken) {
      throw new BadRequestException(
        'accessToken is required via Authorization Bearer header or request body'
      )
    }

    await this.cognitoService.signOut(accessToken)

    return { message: 'Signed out successfully' }
  }
}
