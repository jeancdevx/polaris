import { Injectable, type OnModuleDestroy } from '@nestjs/common'

import { createKafka, createProducer, disconnectProducer } from '@polaris/kafka'

type KafkaProducer = Awaited<ReturnType<typeof createProducer>>

@Injectable()
export class KafkaProducerService implements OnModuleDestroy {
  private producer: KafkaProducer | undefined
  private connectPromise: Promise<KafkaProducer> | undefined

  async getProducer(): Promise<KafkaProducer> {
    if (this.producer) {
      return this.producer
    }

    if (!this.connectPromise) {
      this.connectPromise = this.connect()
    }

    return this.connectPromise
  }

  async onModuleDestroy(): Promise<void> {
    if (this.producer) {
      await disconnectProducer(this.producer)
    }
  }

  private async connect(): Promise<KafkaProducer> {
    const kafka = createKafka({
      clientId: process.env.KAFKA_CLIENT_ID ?? 'reservation-service'
    })
    const producer = await createProducer(kafka)
    this.producer = producer
    return producer
  }
}
