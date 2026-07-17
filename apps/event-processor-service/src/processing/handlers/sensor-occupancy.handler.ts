import { Injectable, Logger } from '@nestjs/common'

import { isBusinessRuleViolationError } from '@polaris/domain'
import type { OccupancyChangedEvent } from '@polaris/kafka'
import { KAFKA_TOPICS, type ParkingSpotStatus } from '@polaris/shared-types'

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

      if (result) {
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
            eventType: 'anomaly_unregistered_occupancy',
            parkingSpotId: event.spotId,
            metadata: {
              deviceId: event.deviceId,
              sensorType: event.sensorType,
              previousStatus: result.previousStatus
            },
            timestamp: new Date(event.occurredAt)
          })
        }

        await this.displayCommands.publishIdleFreeSpots(
          await this.parkingRedisStore.getTotalAvailable()
        )

        this.logger.log(
          `Sensor occupancy processed for ${event.spotId} (${result.previousStatus} -> ${result.spot.status})`
        )
      } else {
        this.logger.debug(
          `Sensor occupancy noop for ${event.spotId} (already ${event.status} or reserved held)`
        )
      }

      // Always re-publish LED. Lambda often updates RDS first, so applyOccupancy
      // returns null — without this the physical LEDs never receive MQTT.
      const ledStatus = await this.resolveLedStatus(event, result?.spot.status)
      const ledOk = await this.ledCommands.publishSpotMode(
        event.spotId,
        ledModeForStatus(ledStatus)
      )
      if (!ledOk) {
        this.logger.warn(
          `LED command skipped for ${event.spotId} (${ledStatus}) — check LED_COMMANDS_ENABLED / IOT_DATA_ENDPOINT`
        )
      }
    } catch (error) {
      this.handleDomainError(error)
    }
  }

  private async resolveLedStatus(
    event: OccupancyChangedEvent,
    appliedStatus: ParkingSpotStatus | undefined
  ): Promise<ParkingSpotStatus> {
    if (appliedStatus) {
      return appliedStatus
    }

    const redisStatus = await this.parkingRedisStore.getSpotStatus(event.spotId)
    if (redisStatus === 'reserved' && event.status === 'free') {
      return 'reserved'
    }

    if (redisStatus) {
      return redisStatus
    }

    return event.status === 'occupied' ? 'occupied' : 'free'
  }

  private handleDomainError(error: unknown): void {
    if (isBusinessRuleViolationError(error)) {
      this.logger.warn(`Sensor occupancy skipped: ${error.message}`)
      return
    }

    throw error
  }
}
