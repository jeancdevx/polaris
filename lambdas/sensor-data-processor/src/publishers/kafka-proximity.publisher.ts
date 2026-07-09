import { createEntryProximityTelemetryEvent } from '@polaris/domain'
import {
  createKafka,
  createProducer,
  disconnectProducer,
  publishDomainEvent,
  type Producer
} from '@polaris/kafka'
import { KAFKA_TOPICS } from '@polaris/shared-types'

import type { EntryProximityIoTEvent } from '../entry-proximity-iot-event.js'

export class KafkaProximityPublisher {
  private producer: Producer | undefined
  private connectPromise: Promise<Producer> | undefined

  constructor(private readonly clientId: string) {}

  async publishEntryProximityTelemetry(
    telemetry: EntryProximityIoTEvent
  ): Promise<void> {
    const producer = await this.getProducer()
    const event = createEntryProximityTelemetryEvent({
      deviceId: telemetry.deviceId,
      event: telemetry.event,
      distanceCm: telemetry.distanceCm,
      gateState: telemetry.gateState,
      occurredAt: telemetry.occurredAt
    })

    await publishDomainEvent(producer, {
      topic: KAFKA_TOPICS.SENSOR_PROXIMITY,
      event,
      partitionKey: telemetry.deviceId
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
