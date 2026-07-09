import { Injectable, Logger } from '@nestjs/common'

import type { ReservationCancelledEvent } from '@polaris/kafka'
import { KAFKA_TOPICS } from '@polaris/shared-types'

import { EventBridgePublisherService } from '../infrastructure/eventbridge-publisher.service.js'
import { IotLedCommandPublisher } from '../infrastructure/iot-led-command.publisher.js'

/** RDS/Redis ya los actualiza reservation-service; aquí solo reenviamos a EventBridge. */
@Injectable()
export class ReservationCancelledHandler {
  private readonly logger = new Logger(ReservationCancelledHandler.name)

  constructor(
    private readonly eventBridgePublisher: EventBridgePublisherService,
    private readonly ledCommands: IotLedCommandPublisher
  ) {}

  async handle(event: ReservationCancelledEvent): Promise<void> {
    await this.eventBridgePublisher.publishReservationEvent({
      detailType: KAFKA_TOPICS.RESERVATION_CANCELLED,
      eventName: event.eventName,
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt,
      reservationId: event.reservationId,
      userId: event.userId,
      parkingSpotId: event.parkingSpotId,
      reason: event.reason
    })

    await this.ledCommands.publishSpotMode(event.parkingSpotId, 'free')

    this.logger.log(
      `Reservation cancelled forwarded for ${event.parkingSpotId} (${event.reservationId})`
    )
  }
}
