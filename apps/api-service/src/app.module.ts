import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AuthModule } from './auth/auth.module.js'
import { HealthModule } from './health/health.module.js'
import { ParkingModule } from './parking/parking.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../infra/local/.env.local', '.env.local', '.env']
    }),
    HealthModule,
    AuthModule,
    ParkingModule
  ]
})
export class AppModule {}
