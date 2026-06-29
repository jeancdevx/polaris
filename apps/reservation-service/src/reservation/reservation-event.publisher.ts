import { Injectable, Logger } from '@nestjs/common'
import {
  createReservationCancelledEvent,
  createReservationCreatedEvent
} from '@polaris/domain'
import { publishDomainEvent } from '@polaris/kafka'
import { KAFKA_TOPICS } from '@polaris/shared-types'
import type { Reservation } from '@polaris/shared-types'

import { KafkaProducerService } from './kafka-producer.service.js'

@Injectable()
export class ReservationEventPublisher {
  private readonly logger = new Logger(ReservationEventPublisher.name)

  constructor(private readonly kafkaProducerService: KafkaProducerService) {}

  async publishCreated(reservation: Reservation): Promise<void> {
    const producer = await this.kafkaProducerService.getProducer()
    const event = createReservationCreatedEvent({
      reservationId: reservation.reservationId,
      userId: reservation.userId,
      parkingSpotId: reservation.parkingSpotId,
      expiresAt: reservation.expiresAt
    })

    await publishDomainEvent(producer, {
      topic: KAFKA_TOPICS.RESERVATION_CREATED,
      event
    })

    this.logger.log(
      `Published ${KAFKA_TOPICS.RESERVATION_CREATED} for ${reservation.reservationId}`
    )
  }

  async publishCancelled(reservation: Reservation): Promise<void> {
    const producer = await this.kafkaProducerService.getProducer()
    const event = createReservationCancelledEvent({
      reservationId: reservation.reservationId,
      userId: reservation.userId,
      parkingSpotId: reservation.parkingSpotId,
      reason: 'user_cancelled'
    })

    await publishDomainEvent(producer, {
      topic: KAFKA_TOPICS.RESERVATION_CANCELLED,
      event
    })

    this.logger.log(
      `Published ${KAFKA_TOPICS.RESERVATION_CANCELLED} for ${reservation.reservationId}`
    )
  }
}
