import { Body, Controller, Headers, Post } from '@nestjs/common'

import type { AuthTokensResponse, MessageResponse } from './types/auth.types.js'

import { AuthService } from './auth.service.js'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  signIn(@Body() body: unknown): Promise<AuthTokensResponse> {
    return this.authService.signIn(body)
  }

  @Post('refresh')
  refresh(@Body() body: unknown): Promise<AuthTokensResponse> {
    return this.authService.refresh(body)
  }

  @Post('logout')
  logout(
    @Body() body: unknown,
    @Headers('authorization') authorization: string | undefined
  ): Promise<MessageResponse> {
    return this.authService.logout(body, authorization)
  }
}
