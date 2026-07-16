import { Injectable, Logger } from '@nestjs/common'

import type { ReservationCreatedEvent } from '@polaris/kafka'
import { KAFKA_TOPICS } from '@polaris/shared-types'

import { AuditLogRepository } from '../infrastructure/audit-log.repository.js'
import { insertAuditLogSafe } from '../infrastructure/audit-log.safe.js'
import { EventBridgePublisherService } from '../infrastructure/eventbridge-publisher.service.js'
import { IotDisplayCommandPublisher } from '../infrastructure/iot-display-command.publisher.js'
import { IotLedCommandPublisher } from '../infrastructure/iot-led-command.publisher.js'
import { ParkingRedisStore } from '../parking/parking-redis.store.js'

@Injectable()
export class ReservationCreatedHandler {
  private readonly logger = new Logger(ReservationCreatedHandler.name)

  constructor(
    private readonly eventBridgePublisher: EventBridgePublisherService,
    private readonly ledCommands: IotLedCommandPublisher,
    private readonly displayCommands: IotDisplayCommandPublisher,
    private readonly parkingRedisStore: ParkingRedisStore,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async handle(event: ReservationCreatedEvent): Promise<void> {
    // Physical actuators first — EventBridge must not block LED/LCD.
    await this.ledCommands.publishSpotMode(event.parkingSpotId, 'blink_blue')
    await this.displayCommands.publishIdleFreeSpots(
      await this.parkingRedisStore.getTotalAvailable()
    )

    await insertAuditLogSafe(this.auditLogRepository, {
      eventType: KAFKA_TOPICS.RESERVATION_CREATED,
      userId: event.userId,
      parkingSpotId: event.parkingSpotId,
      metadata: {
        reservationId: event.reservationId,
        expiresAt: event.expiresAt
      },
      timestamp: new Date(event.occurredAt)
    })

    try {
      await this.eventBridgePublisher.publishReservationEvent({
        detailType: KAFKA_TOPICS.RESERVATION_CREATED,
        eventName: event.eventName,
        aggregateId: event.aggregateId,
        occurredAt: event.occurredAt,
        reservationId: event.reservationId,
        userId: event.userId,
        parkingSpotId: event.parkingSpotId,
        previousStatus: 'free',
        currentStatus: 'reserved',
        expiresAt: event.expiresAt
      })
    } catch (error) {
      this.logger.error(
        `EventBridge publish failed for reservation ${event.reservationId}; LED/LCD already updated`,
        error
      )
    }

    this.logger.log(
      `Reservation created forwarded for ${event.parkingSpotId} (${event.reservationId})`
    )
  }
}
