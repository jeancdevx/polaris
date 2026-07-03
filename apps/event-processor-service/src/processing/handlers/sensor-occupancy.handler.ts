import { Injectable, Logger } from '@nestjs/common'

import { isBusinessRuleViolationError } from '@polaris/domain'
import type { OccupancyChangedEvent } from '@polaris/kafka'
import { KAFKA_TOPICS } from '@polaris/shared-types'

import { EventBridgePublisherService } from '../infrastructure/eventbridge-publisher.service.js'
import { ParkingRedisStore } from '../parking/parking-redis.store.js'
import { ParkingRepository } from '../parking/parking.repository.js'

@Injectable()
export class SensorOccupancyHandler {
  private readonly logger = new Logger(SensorOccupancyHandler.name)

  constructor(
    private readonly parkingRepository: ParkingRepository,
    private readonly parkingRedisStore: ParkingRedisStore,
    private readonly eventBridgePublisher: EventBridgePublisherService
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

      await this.eventBridgePublisher.publishProcessedParkingEvent({
        detailType: KAFKA_TOPICS.SENSOR_OCCUPANCY,
        eventName: event.eventName,
        aggregateId: event.aggregateId,
        occurredAt: event.occurredAt,
        parkingSpotId: event.spotId,
        previousStatus: result.previousStatus,
        currentStatus: result.spot.status,
        deviceId: event.deviceId,
        sensorType: event.sensorType
      })

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
