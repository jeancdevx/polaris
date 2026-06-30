import { Injectable, Logger } from '@nestjs/common'
import { isBusinessRuleViolationError } from '@polaris/domain'
import type { OccupancyChangedEvent } from '@polaris/kafka'

import { ParkingRedisStore } from '../parking/parking-redis.store.js'
import { ParkingRepository } from '../parking/parking.repository.js'

@Injectable()
export class SensorOccupancyHandler {
  private readonly logger = new Logger(SensorOccupancyHandler.name)

  constructor(
    private readonly parkingRepository: ParkingRepository,
    private readonly parkingRedisStore: ParkingRedisStore
  ) {}

  async handle(event: OccupancyChangedEvent): Promise<void> {
    try {
      const result = await this.parkingRepository.applyOccupancyChange({
        spotId: event.spotId,
        status: event.status,
        occurredAt: new Date(event.occurredAt)
      })

      if (!result) {
        return
      }

      await this.parkingRedisStore.syncSpotTransition(
        result.spot,
        result.previousStatus
      )

      this.logger.log(
        `Sensor occupancy processed for ${event.spotId} (${result.previousStatus} -> ${result.spot.status})`
      )
    } catch (error) {
      this.handleDomainError(error)
    }
  }

  private handleDomainError(error: unknown): void {
    if (isBusinessRuleViolationError(error)) {
      this.logger.warn(`Sensor occupancy skipped: ${error.message}`)
      return
    }

    throw error
  }
}
