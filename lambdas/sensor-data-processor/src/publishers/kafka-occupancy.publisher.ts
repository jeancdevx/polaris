import { createOccupancyChangedEvent } from '@polaris/domain'
import {
  createKafka,
  createProducer,
  disconnectProducer,
  publishDomainEvent,
  type Producer
} from '@polaris/kafka'
import { KAFKA_TOPICS } from '@polaris/shared-types'

import type { OccupancyChangedIoTEvent } from '../iot-event.js'

export class KafkaOccupancyPublisher {
  private producer: Producer | undefined
  private connectPromise: Promise<Producer> | undefined

  constructor(private readonly clientId: string) {}

  async publishOccupancyChanged(
    reading: OccupancyChangedIoTEvent
  ): Promise<void> {
    const producer = await this.getProducer()
    const event = createOccupancyChangedEvent({
      spotId: reading.spotId,
      status: reading.status,
      deviceId: reading.deviceId,
      sensorType: reading.sensorType,
      occurredAt: reading.occurredAt
    })

    await publishDomainEvent(producer, {
      topic: KAFKA_TOPICS.SENSOR_OCCUPANCY,
      event,
      partitionKey: reading.spotId
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
        {
          allowAutoTopicCreation: false
        }
      )
    }

    return this.connectPromise
  }
}
