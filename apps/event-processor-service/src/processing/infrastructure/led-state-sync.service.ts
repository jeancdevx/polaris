import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'

import type { ParkingSpotRow } from '@polaris/database'
import type { ParkingSpotStatus } from '@polaris/shared-types'

import { DatabaseService } from './database.service.js'
import { IotDisplayCommandPublisher } from './iot-display-command.publisher.js'
import { IotLedCommandPublisher } from './iot-led-command.publisher.js'
import { ledModeForStatus } from './led-mode.js'
import { parkingSpotKey } from './parking.constants.js'
import { RedisService } from './redis.service.js'

const DEMO_SPOT_COUNT = 10

@Injectable()
export class LedStateSyncService implements OnModuleInit {
  private readonly logger = new Logger(LedStateSyncService.name)

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly ledCommands: IotLedCommandPublisher,
    private readonly displayCommands: IotDisplayCommandPublisher
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const synced = await this.syncAllFromPreferRedis()
      this.logger.log(`LED cloud sync published for ${synced} parking spots`)
    } catch (error) {
      this.logger.error('LED cloud sync failed on startup', error)
    }
  }

  async syncAllFromPreferRedis(): Promise<number> {
    try {
      const fromRedis = await this.loadStatusesFromRedis()
      if (fromRedis.size > 0) {
        return this.publishStatuses(fromRedis, 'redis')
      }
    } catch (error) {
      this.logger.warn(
        'LED cloud sync could not read Redis; falling back to database',
        error
      )
    }

    return this.syncAllFromDatabase()
  }

  async syncAllFromDatabase(): Promise<number> {
    const dataSource = await this.databaseService.getDataSource()
    const rows = await dataSource
      .getRepository<ParkingSpotRow>('ParkingSpot')
      .find({ order: { spotId: 'ASC' } })

    const statuses = new Map<string, ParkingSpotStatus>()
    for (const row of rows) {
      statuses.set(row.spotId, row.status as ParkingSpotStatus)
    }

    return this.publishStatuses(statuses, 'database')
  }

  private async loadStatusesFromRedis(): Promise<
    Map<string, ParkingSpotStatus>
  > {
    const client = await this.redisService.getClient()
    const statuses = new Map<string, ParkingSpotStatus>()

    for (let spotNumber = 1; spotNumber <= DEMO_SPOT_COUNT; ++spotNumber) {
      const spotId = `spot-${String(spotNumber).padStart(2, '0')}`
      const status = await client.hGet(parkingSpotKey(spotId), 'status')
      statuses.set(
        spotId,
        status === 'occupied' || status === 'reserved' ? status : 'free'
      )
    }

    return statuses
  }

  private async publishStatuses(
    statuses: Map<string, ParkingSpotStatus>,
    source: 'redis' | 'database'
  ): Promise<number> {
    let published = 0
    let freeSpots = 0

    for (const [spotId, status] of statuses) {
      if (status === 'free') {
        freeSpots += 1
      }

      try {
        const ok = await this.ledCommands.publishSpotMode(
          spotId,
          ledModeForStatus(status)
        )

        if (ok) {
          published += 1
          this.logger.log(`LED cloud sync ${spotId} -> ${status} (${source})`)
        }
      } catch (error) {
        this.logger.error(
          `LED cloud sync failed for ${spotId} (${status})`,
          error
        )
      }
    }

    try {
      await this.displayCommands.publishIdleFreeSpots(freeSpots)
    } catch (error) {
      this.logger.error('LCD idle free spots sync failed on startup', error)
    }

    if (published === 0 && statuses.size > 0) {
      throw new Error(
        `LED cloud sync published 0/${statuses.size} spots — check iot:Publish + iot:RetainPublish IAM`
      )
    }

    return published
  }
}
