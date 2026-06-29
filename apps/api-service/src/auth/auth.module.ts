import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { cognitoConfig } from './cognito.config.js'
import { CognitoService } from './cognito.service.js'

@Module({
  imports: [ConfigModule.forFeature(cognitoConfig)],
  controllers: [AuthController],
  providers: [AuthService, CognitoService]
})
export class AuthModule {}
