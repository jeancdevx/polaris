import { Injectable, Logger } from '@nestjs/common'
import { isBusinessRuleViolationError } from '@polaris/domain'
import type { VehicleExitEvent } from '@polaris/kafka'

import { ParkingRedisStore } from '../parking/parking-redis.store.js'
import { ParkingRepository } from '../parking/parking.repository.js'

@Injectable()
export class VehicleExitHandler {
  private readonly logger = new Logger(VehicleExitHandler.name)

  constructor(
    private readonly parkingRepository: ParkingRepository,
    private readonly parkingRedisStore: ParkingRedisStore
  ) {}

  async handle(event: VehicleExitEvent): Promise<void> {
    try {
      const occurredAt = new Date(event.occurredAt)
      const { spot, previousStatus } =
        await this.parkingRepository.applyVehicleExit({
          parkingSpotId: event.parkingSpotId,
          userId: event.userId,
          reservationId: event.reservationId,
          occurredAt
        })

      await this.parkingRedisStore.syncSpotTransition(spot, previousStatus)

      this.logger.log(
        `Vehicle exit processed for ${event.parkingSpotId} (${previousStatus} -> ${spot.status})`
      )
    } catch (error) {
      this.handleDomainError(error)
    }
  }

  private handleDomainError(error: unknown): void {
    if (isBusinessRuleViolationError(error)) {
      this.logger.warn(`Vehicle exit skipped: ${error.message}`)
      return
    }

    throw error
  }
}
