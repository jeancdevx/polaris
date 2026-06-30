import { Injectable, Logger } from '@nestjs/common'
import { isBusinessRuleViolationError } from '@polaris/domain'
import type { VehicleEntryEvent } from '@polaris/kafka'

import { ParkingRedisStore } from '../parking/parking-redis.store.js'
import { ParkingRepository } from '../parking/parking.repository.js'

@Injectable()
export class VehicleEntryHandler {
  private readonly logger = new Logger(VehicleEntryHandler.name)

  constructor(
    private readonly parkingRepository: ParkingRepository,
    private readonly parkingRedisStore: ParkingRedisStore
  ) {}

  async handle(event: VehicleEntryEvent): Promise<void> {
    try {
      const occurredAt = new Date(event.occurredAt)
      const { spot, previousStatus } =
        await this.parkingRepository.applyVehicleEntry({
          parkingSpotId: event.parkingSpotId,
          userId: event.userId,
          reservationId: event.reservationId,
          occurredAt
        })

      await this.parkingRedisStore.syncSpotTransition(spot, previousStatus)

      this.logger.log(
        `Vehicle entry processed for ${event.parkingSpotId} (${previousStatus} -> ${spot.status})`
      )
    } catch (error) {
      this.handleDomainError(error)
    }
  }

  private handleDomainError(error: unknown): void {
    if (isBusinessRuleViolationError(error)) {
      this.logger.warn(`Vehicle entry skipped: ${error.message}`)
      return
    }

    throw error
  }
}
