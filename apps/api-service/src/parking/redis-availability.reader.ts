import { Injectable, Logger } from '@nestjs/common'

import type { ParkingStatus } from '@polaris/shared-types'
import {
  scanRedisKeyBatches,
  spotIdFromParkingSpotKey
} from '@polaris/shared-utils'

import {
  PARKING_SPOT_KEY_PATTERN,
  PARKING_STATS_KEYS
} from './parking.constants.js'
import {
  buildParkingStatus,
  mapRedisHashToParkingSpot
} from './parking.mapper.js'
import { RedisService } from './redis.service.js'

@Injectable()
export class RedisAvailabilityReader {
  private readonly logger = new Logger(RedisAvailabilityReader.name)

  constructor(private readonly redisService: RedisService) {}

  async tryGetAvailability(): Promise<ParkingStatus | null> {
    try {
      const client = await this.redisService.getClient()
      const spots = []

      for await (const keys of scanRedisKeyBatches(client, {
        match: PARKING_SPOT_KEY_PATTERN,
        count: 100
      })) {
        for (const key of keys) {
          const spotId = spotIdFromParkingSpotKey(key)
          const hash = await client.hGetAll(key)
          const spot = mapRedisHashToParkingSpot(spotId, hash)

          if (spot) {
            spots.push(spot)
          }
        }
      }

      if (spots.length === 0) {
        this.logger.debug(
          'Redis cache cold — no parking:spot:* keys; falling back to RDS'
        )
        return null
      }

      const status = buildParkingStatus(spots)
      await this.logStatsDrift(client, status)

      return status
    } catch (error) {
      this.logger.warn('Redis availability read failed', error)
      return null
    }
  }

  private async logStatsDrift(
    client: Awaited<ReturnType<RedisService['getClient']>>,
    status: ParkingStatus
  ): Promise<void> {
    const [available, occupied, reserved] = await Promise.all([
      client.get(PARKING_STATS_KEYS.totalAvailable),
      client.get(PARKING_STATS_KEYS.totalOccupied),
      client.get(PARKING_STATS_KEYS.totalReserved)
    ])

    if (available === null && occupied === null && reserved === null) {
      return
    }

    const statsAvailable = Number(available ?? status.totalAvailable)
    const statsOccupied = Number(occupied ?? status.totalOccupied)
    const statsReserved = Number(reserved ?? status.totalReserved)

    if (
      statsAvailable !== status.totalAvailable ||
      statsOccupied !== status.totalOccupied ||
      statsReserved !== status.totalReserved
    ) {
      this.logger.debug(
        'Redis stats counters differ from spot aggregates; using spot data'
      )
    }
  }
}
