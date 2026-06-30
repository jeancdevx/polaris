import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import {
  createConsumer,
  createKafka,
  disconnectConsumer,
  runConsumer,
  type KafkaMessageHandler
} from '@polaris/kafka'
import { KAFKA_TOPICS, type KafkaTopic } from '@polaris/shared-types'

import { EventDispatcherService } from './event-dispatcher.service.js'

export const ALL_KAFKA_TOPICS = Object.values(KAFKA_TOPICS) as KafkaTopic[]

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name)
  private consumer: Awaited<ReturnType<typeof createConsumer>> | undefined
  private runPromise: Promise<void> | undefined
  private readyResolve: (() => void) | undefined
  private readonly readyPromise = new Promise<void>(resolve => {
    this.readyResolve = resolve
  })

  constructor(
    private readonly config: ConfigService,
    private readonly dispatcher: EventDispatcherService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.start()
  }

  async onModuleDestroy(): Promise<void> {
    if (this.consumer) {
      await disconnectConsumer(this.consumer)
    }

    await this.runPromise?.catch(() => undefined)
  }

  whenReady(): Promise<void> {
    return this.readyPromise
  }

  private async start(): Promise<void> {
    const groupId =
      this.config.get<string>('eventProcessor.consumerGroupId') ??
      'event-processor-service'
    const clientId =
      this.config.get<string>('eventProcessor.clientId') ??
      'event-processor-service'

    const kafka = createKafka({ clientId, logLevel: 0 })
    this.consumer = await createConsumer(groupId, kafka)

    this.consumer.on(this.consumer.events.GROUP_JOIN, () => {
      this.readyResolve?.()
      this.readyResolve = undefined
    })

    const handler: KafkaMessageHandler = async (event, context) => {
      await this.dispatcher.dispatch(event, context)
    }

    this.runPromise = runConsumer(
      this.consumer,
      ALL_KAFKA_TOPICS,
      handler
    ).catch(error => {
      this.logger.error('Kafka consumer stopped unexpectedly', error)
      throw error
    })
  }
}
