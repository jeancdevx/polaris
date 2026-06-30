import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { CognitoAdminService } from './cognito-admin.service.js'
import { RfidValidationStore } from './rfid-validation.store.js'
import { usersConfig } from './users.config.js'
import { UsersController } from './users.controller.js'
import { UsersRepository } from './users.repository.js'
import { UsersService } from './users.service.js'

@Module({
  imports: [ConfigModule.forFeature(usersConfig)],
  controllers: [UsersController],
  providers: [
    UsersRepository,
    UsersService,
    CognitoAdminService,
    RfidValidationStore
  ]
})
export class UsersModule {}
