import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'

import type { ParkingSpotRow } from '@polaris/database'
import type { ParkingSpotStatus } from '@polaris/shared-types'

import { DatabaseService } from './database.service.js'
import { IotDisplayCommandPublisher } from './iot-display-command.publisher.js'
import { IotLedCommandPublisher } from './iot-led-command.publisher.js'
import { ledModeForStatus } from './led-mode.js'

@Injectable()
export class LedStateSyncService implements OnModuleInit {
  private readonly logger = new Logger(LedStateSyncService.name)

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly ledCommands: IotLedCommandPublisher,
    private readonly displayCommands: IotDisplayCommandPublisher
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const synced = await this.syncAllFromDatabase()
      this.logger.log(`LED cloud sync published for ${synced} parking spots`)
    } catch (error) {
      this.logger.error('LED cloud sync failed on startup', error)
    }
  }

  async syncAllFromDatabase(): Promise<number> {
    const dataSource = await this.databaseService.getDataSource()
    const rows = await dataSource
      .getRepository<ParkingSpotRow>('ParkingSpot')
      .find({ order: { spotId: 'ASC' } })

    let published = 0
    let freeSpots = 0

    for (const row of rows) {
      if (row.status === 'free') {
        freeSpots += 1
      }

      try {
        const ok = await this.ledCommands.publishSpotMode(
          row.spotId,
          ledModeForStatus(row.status as ParkingSpotStatus)
        )

        if (ok) {
          published += 1
          this.logger.log(`LED cloud sync ${row.spotId} -> ${row.status}`)
        }
      } catch (error) {
        this.logger.error(
          `LED cloud sync failed for ${row.spotId} (${row.status})`,
          error
        )
      }
    }

    try {
      await this.displayCommands.publishIdleFreeSpots(freeSpots)
    } catch (error) {
      this.logger.error('LCD idle free spots sync failed on startup', error)
    }

    if (published === 0 && rows.length > 0) {
      throw new Error(
        `LED cloud sync published 0/${rows.length} spots — check iot:Publish + iot:RetainPublish IAM`
      )
    }

    return published
  }
}
