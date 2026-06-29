import { Injectable, Logger } from '@nestjs/common'

import type { ParkingStatus } from '@polaris/shared-types'

import { RdsAvailabilityReader } from './rds-availability.reader.js'
import { RedisAvailabilityReader } from './redis-availability.reader.js'

@Injectable()
export class ParkingService {
  private readonly logger = new Logger(ParkingService.name)

  constructor(
    private readonly redisAvailabilityReader: RedisAvailabilityReader,
    private readonly rdsAvailabilityReader: RdsAvailabilityReader
  ) {}

  async getAvailability(): Promise<ParkingStatus> {
    const fromRedis = await this.redisAvailabilityReader.tryGetAvailability()

    if (fromRedis) {
      this.logger.debug('Parking availability served from Redis')
      return fromRedis
    }

    this.logger.debug('Parking availability served from RDS fallback')
    return this.rdsAvailabilityReader.getAvailability()
  }
}
