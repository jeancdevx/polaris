import type { ReservationRow } from '@polaris/database'
import { createReservationCancelledEvent } from '@polaris/domain'
import {
  createKafka,
  createProducer,
  disconnectProducer,
  publishDomainEvent,
  type Producer
} from '@polaris/kafka'
import { KAFKA_TOPICS } from '@polaris/shared-types'

export class KafkaReservationPublisher {
  private producer: Producer | undefined
  private connectPromise: Promise<Producer> | undefined

  constructor(private readonly clientId: string) {}

  async publishExpired(row: ReservationRow): Promise<void> {
    const producer = await this.getProducer()
    const event = createReservationCancelledEvent({
      reservationId: row.reservationId,
      userId: row.userId,
      parkingSpotId: row.parkingSpotId,
      reason: 'expired',
      occurredAt: row.expiredAt ?? new Date()
    })

    await publishDomainEvent(producer, {
      topic: KAFKA_TOPICS.RESERVATION_CANCELLED,
      event,
      partitionKey: row.reservationId
    })
  }

  async disconnect(): Promise<void> {
    if (this.producer) {
      await disconnectProducer(this.producer)
      this.producer = undefined
      this.connectPromise = undefined
    }
  }

  private getProducer(): Promise<Producer> {
    if (!this.connectPromise) {
      this.connectPromise = createProducer(
        createKafka({ clientId: this.clientId }),
        { allowAutoTopicCreation: false }
      )
    }

    return this.connectPromise
  }
}
