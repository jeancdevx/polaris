import { Injectable, type OnModuleDestroy } from '@nestjs/common'

import { createDataSource, type ParkingSpotRow } from '@polaris/database'
import type { ParkingStatus } from '@polaris/shared-types'

import { buildParkingStatus, mapParkingSpotRow } from './parking.mapper.js'

@Injectable()
export class RdsAvailabilityReader implements OnModuleDestroy {
  private dataSource: ReturnType<typeof createDataSource> | undefined

  async onModuleDestroy(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy()
    }
  }

  async getAvailability(): Promise<ParkingStatus> {
    const dataSource = await this.getDataSource()
    const repository = dataSource.getRepository<ParkingSpotRow>('ParkingSpot')
    const rows = await repository.find({
      order: { spotId: 'ASC' }
    })

    return buildParkingStatus(rows.map(mapParkingSpotRow))
  }

  private async getDataSource(): Promise<ReturnType<typeof createDataSource>> {
    if (this.dataSource?.isInitialized) {
      return this.dataSource
    }

    this.dataSource = createDataSource()
    await this.dataSource.initialize()
    return this.dataSource
  }
}
