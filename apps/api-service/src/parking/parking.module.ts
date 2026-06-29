import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { ParkingController } from './parking.controller.js'
import { parkingConfig } from './parking.config.js'
import { ParkingService } from './parking.service.js'
import { RdsAvailabilityReader } from './rds-availability.reader.js'
import { RedisAvailabilityReader } from './redis-availability.reader.js'
import { RedisService } from './redis.service.js'

@Module({
  imports: [ConfigModule.forFeature(parkingConfig)],
  controllers: [ParkingController],
  providers: [
    RedisService,
    RedisAvailabilityReader,
    RdsAvailabilityReader,
    ParkingService
  ]
})
export class ParkingModule {}
