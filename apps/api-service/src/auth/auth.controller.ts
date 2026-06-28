import { Body, Controller, Headers, Post } from '@nestjs/common'

import { AuthService } from './auth.service.js'
import type {
  AuthTokensResponse,
  MessageResponse,
  SignupResponse
} from './types/auth.types.js'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signUp(@Body() body: unknown): Promise<SignupResponse> {
    return this.authService.signUp(body)
  }

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
