import { Injectable, Logger } from '@nestjs/common'

import { isBusinessRuleViolationError } from '@polaris/domain'
import type { OccupancyChangedEvent } from '@polaris/kafka'
import { KAFKA_TOPICS } from '@polaris/shared-types'

import { AuditLogRepository } from '../infrastructure/audit-log.repository.js'
import { EventBridgePublisherService } from '../infrastructure/eventbridge-publisher.service.js'
import { IotDisplayCommandPublisher } from '../infrastructure/iot-display-command.publisher.js'
import { IotLedCommandPublisher } from '../infrastructure/iot-led-command.publisher.js'
import { ledModeForStatus } from '../infrastructure/led-mode.js'
import { ParkingRedisStore } from '../parking/parking-redis.store.js'
import { ParkingRepository } from '../parking/parking.repository.js'

@Injectable()
export class SensorOccupancyHandler {
  private readonly logger = new Logger(SensorOccupancyHandler.name)

  constructor(
    private readonly parkingRepository: ParkingRepository,
    private readonly parkingRedisStore: ParkingRedisStore,
    private readonly eventBridgePublisher: EventBridgePublisherService,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly ledCommands: IotLedCommandPublisher,
    private readonly displayCommands: IotDisplayCommandPublisher
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

      if (
        result.previousStatus === 'reserved' &&
        result.spot.status === 'occupied' &&
        !result.spot.userId
      ) {
        await this.auditLogRepository.insert({
          eventType: 'anomaly_reserved_occupancy_without_user',
          parkingSpotId: event.spotId,
          metadata: {
            deviceId: event.deviceId,
            sensorType: event.sensorType
          },
          timestamp: new Date(event.occurredAt)
        })
      }

      await this.ledCommands.publishSpotMode(
        event.spotId,
        ledModeForStatus(result.spot.status)
      )

      await this.displayCommands.publishIdleFreeSpots(
        await this.parkingRedisStore.getTotalAvailable()
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
