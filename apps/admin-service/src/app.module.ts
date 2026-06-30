import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AuditModule } from './audit/audit.module.js'
import { DatabaseModule } from './infrastructure/database.module.js'
import { HealthModule } from './health/health.module.js'
import { MetricsModule } from './metrics/metrics.module.js'
import { UsersModule } from './users/users.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../infra/local/.env.local', '.env.local', '.env']
    }),
    DatabaseModule,
    HealthModule,
    UsersModule,
    AuditModule,
    MetricsModule
  ]
})
export class AppModule {}
