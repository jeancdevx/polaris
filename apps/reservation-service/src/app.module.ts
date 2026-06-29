import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { HealthModule } from './health/health.module.js'
import { ReservationModule } from './reservation/reservation.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../infra/local/.env.local', '.env.local', '.env']
    }),
    HealthModule,
    ReservationModule
  ]
})
export class AppModule {}
