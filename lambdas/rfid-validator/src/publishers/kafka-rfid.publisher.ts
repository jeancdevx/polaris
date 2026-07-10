import {
  createAccessDeniedEvent,
  createRfidValidatedEvent,
  type AccessDenialReason,
  type RfidValidationResult
} from '@polaris/domain'
import {
  createKafka,
  createProducer,
  disconnectProducer,
  publishDomainEvent,
  type Producer
} from '@polaris/kafka'
import { KAFKA_TOPICS } from '@polaris/shared-types'
import { sleep } from '@polaris/shared-utils'

import type { RfidScanEvent } from '../iot-event.js'

export type PublishRfidValidationInput = Readonly<{
  scan: RfidScanEvent
  result: RfidValidationResult
}>

export class KafkaRfidPublisher {
  private producer: Producer | undefined
  private connectPromise: Promise<Producer> | undefined

  private static readonly connectTimeoutMs = 8_000

  constructor(private readonly clientId: string) {}

  async publishValidation(input: PublishRfidValidationInput): Promise<void> {
    const producer = await this.getProducer()
    const event = createRfidValidatedEvent({
      rfidUid: input.scan.rfidUid,
      readerLocation: input.scan.readerLocation,
      deviceId: input.scan.deviceId,
      result: input.result,
      occurredAt: input.scan.occurredAt
    })

    await publishDomainEvent(producer, {
      topic: KAFKA_TOPICS.RFID_VALIDATION,
      event,
      partitionKey: input.scan.rfidUid
    })

    if (!input.result.valid && input.result.reason) {
      const denialReason = input.result.reason as AccessDenialReason
      const denied = createAccessDeniedEvent({
        rfidUid: input.scan.rfidUid,
        gate: input.scan.readerLocation,
        reason: denialReason,
        occurredAt: input.scan.occurredAt
      })

      await publishDomainEvent(producer, {
        topic: KAFKA_TOPICS.AUDIT_EVENTS,
        event: denied,
        partitionKey: input.scan.rfidUid
      })
    }
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
      this.connectPromise = this.connectProducerWithTimeout()
    }

    return this.connectPromise
  }

  private async connectProducerWithTimeout(): Promise<Producer> {
    try {
      const producer = await Promise.race([
        createProducer(createKafka({ clientId: this.clientId }), {
          allowAutoTopicCreation: false
        }),
        sleep(KafkaRfidPublisher.connectTimeoutMs).then(() => {
          throw new Error('Kafka producer connect timed out')
        })
      ])

      this.producer = producer
      return producer
    } catch (error) {
      this.connectPromise = undefined
      throw error
    }
  }
}
