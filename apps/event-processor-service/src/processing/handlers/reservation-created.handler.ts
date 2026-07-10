import { Injectable, Logger } from '@nestjs/common'

import type { ReservationCreatedEvent } from '@polaris/kafka'
import { KAFKA_TOPICS } from '@polaris/shared-types'

import { EventBridgePublisherService } from '../infrastructure/eventbridge-publisher.service.js'
import { IotLedCommandPublisher } from '../infrastructure/iot-led-command.publisher.js'

/** RDS/Redis ya los actualiza reservation-service; aquí solo reenviamos a EventBridge. */
@Injectable()
export class ReservationCreatedHandler {
  private readonly logger = new Logger(ReservationCreatedHandler.name)

  constructor(
    private readonly eventBridgePublisher: EventBridgePublisherService,
    private readonly ledCommands: IotLedCommandPublisher
  ) {}

  async handle(event: ReservationCreatedEvent): Promise<void> {
    await this.eventBridgePublisher.publishReservationEvent({
      detailType: KAFKA_TOPICS.RESERVATION_CREATED,
      eventName: event.eventName,
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt,
      reservationId: event.reservationId,
      userId: event.userId,
      parkingSpotId: event.parkingSpotId,
      expiresAt: event.expiresAt
    })

    await this.ledCommands.publishSpotMode(event.parkingSpotId, 'blink_blue')

    this.logger.log(
      `Reservation created forwarded for ${event.parkingSpotId} (${event.reservationId})`
    )
  }
}
