import { Injectable, Logger } from '@nestjs/common'

import type { ParkingSpotRow } from '@polaris/database'
import type { ParkingStatus } from '@polaris/shared-types'

import { DatabaseService } from '../infrastructure/database.service.js'
import { PARKING_SPOT_KEY_PREFIX } from './parking.constants.js'
import {
  buildParkingStatus,
  mapParkingSpotRow,
  mapRedisHashToParkingSpot
} from './parking.mapper.js'
import { RedisService } from './redis.service.js'

@Injectable()
export class ParkingStatusReader {
  private readonly logger = new Logger(ParkingStatusReader.name)

  constructor(
    private readonly redisService: RedisService,
    private readonly databaseService: DatabaseService
  ) {}

  async getParkingStatus(): Promise<ParkingStatus> {
    const fromRedis = await this.tryGetFromRedis()

    if (fromRedis) {
      return fromRedis
    }

    return this.getFromRds()
  }

  private async tryGetFromRedis(): Promise<ParkingStatus | null> {
    try {
      const client = await this.redisService.getClient()
      const spots = []

      for await (const rawKeys of client.scanIterator({
        MATCH: `${PARKING_SPOT_KEY_PREFIX}*`,
        COUNT: 100
      })) {
        const keys = Array.isArray(rawKeys) ? rawKeys : [rawKeys]

        for (const key of keys) {
          if (!key) {
            continue
          }

          const spotId = key.slice(PARKING_SPOT_KEY_PREFIX.length)
          const hash = await client.hGetAll(key)
          const spot = mapRedisHashToParkingSpot(spotId, hash)

          if (spot) {
            spots.push(spot)
          }
        }
      }

      if (spots.length === 0) {
        return null
      }

      return buildParkingStatus(spots)
    } catch (error) {
      this.logger.warn('Redis parking status read failed', error)
      return null
    }
  }

  private async getFromRds(): Promise<ParkingStatus> {
    const dataSource = await this.databaseService.getDataSource()
    const repository = dataSource.getRepository<ParkingSpotRow>('ParkingSpot')
    const rows = await repository.find({ order: { spotId: 'ASC' } })

    return buildParkingStatus(rows.map(mapParkingSpotRow))
  }
}
