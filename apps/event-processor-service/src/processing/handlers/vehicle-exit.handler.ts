import { Injectable, Logger } from '@nestjs/common'

import { isBusinessRuleViolationError } from '@polaris/domain'
import type { VehicleExitEvent } from '@polaris/kafka'
import { KAFKA_TOPICS } from '@polaris/shared-types'

import { EventBridgePublisherService } from '../infrastructure/eventbridge-publisher.service.js'
import { IotDisplayCommandPublisher } from '../infrastructure/iot-display-command.publisher.js'
import { IotLedCommandPublisher } from '../infrastructure/iot-led-command.publisher.js'
import { ParkingRedisStore } from '../parking/parking-redis.store.js'
import { ParkingRepository } from '../parking/parking.repository.js'

@Injectable()
export class VehicleExitHandler {
  private readonly logger = new Logger(VehicleExitHandler.name)

  constructor(
    private readonly parkingRepository: ParkingRepository,
    private readonly parkingRedisStore: ParkingRedisStore,
    private readonly eventBridgePublisher: EventBridgePublisherService,
    private readonly ledCommands: IotLedCommandPublisher,
    private readonly displayCommands: IotDisplayCommandPublisher
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

      await this.eventBridgePublisher.publishProcessedParkingEvent({
        detailType: KAFKA_TOPICS.VEHICLE_EXIT,
        eventName: event.eventName,
        aggregateId: event.aggregateId,
        occurredAt: event.occurredAt,
        parkingSpotId: event.parkingSpotId,
        previousStatus,
        currentStatus: spot.status,
        userId: event.userId,
        reservationId: event.reservationId,
        vehiclePlate: event.vehiclePlate
      })

      await this.ledCommands.publishSpotMode(event.parkingSpotId, 'free')
      await this.displayCommands.publishIdleFreeSpots(
        await this.parkingRedisStore.getTotalAvailable()
      )

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
