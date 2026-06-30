import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { metricsConfig } from './metrics.config.js'
import { MetricsController } from './metrics.controller.js'
import { MetricsRepository } from './metrics.repository.js'
import { MetricsService } from './metrics.service.js'
import { ParkingStatusReader } from './parking-status.reader.js'
import { RedisService } from './redis.service.js'

@Module({
  imports: [ConfigModule.forFeature(metricsConfig)],
  controllers: [MetricsController],
  providers: [
    RedisService,
    ParkingStatusReader,
    MetricsRepository,
    MetricsService
  ]
})
export class MetricsModule {}
