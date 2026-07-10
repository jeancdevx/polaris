import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'

import type { ParkingSpotRow } from '@polaris/database'
import type { ParkingSpotStatus } from '@polaris/shared-types'

import { DatabaseService } from './database.service.js'
import { IotLedCommandPublisher } from './iot-led-command.publisher.js'
import { ledModeForStatus } from './led-mode.js'

@Injectable()
export class LedStateSyncService implements OnModuleInit {
  private readonly logger = new Logger(LedStateSyncService.name)

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly ledCommands: IotLedCommandPublisher
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const synced = await this.syncAllFromDatabase()
      this.logger.log(`LED state sync published for ${synced} parking spots`)
    } catch (error) {
      this.logger.warn('LED state sync skipped on startup', error)
    }
  }

  async syncAllFromDatabase(): Promise<number> {
    const dataSource = await this.databaseService.getDataSource()
    const rows = await dataSource
      .getRepository<ParkingSpotRow>('ParkingSpot')
      .find({ order: { spotId: 'ASC' } })

    for (const row of rows) {
      await this.ledCommands.publishSpotMode(
        row.spotId,
        ledModeForStatus(row.status as ParkingSpotStatus)
      )
    }

    return rows.length
  }
}
