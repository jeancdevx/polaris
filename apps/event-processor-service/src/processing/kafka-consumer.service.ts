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

import { ConsumedEventService } from './consumed-event.service.js'
import { EventDispatcherService } from './event-dispatcher.service.js'

export const ALL_KAFKA_TOPICS = Object.values(KAFKA_TOPICS) as KafkaTopic[]

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name)
  private consumer: Awaited<ReturnType<typeof createConsumer>> | undefined
  private runPromise: Promise<void> | undefined
  private readyResolve: (() => void) | undefined
  private groupJoined = false
  private stoppedUnexpectedly = false
  private lastProcessedAt: Date | undefined
  private readonly readyPromise = new Promise<void>(resolve => {
    this.readyResolve = resolve
  })

  constructor(
    private readonly config: ConfigService,
    private readonly dispatcher: EventDispatcherService,
    private readonly consumedEvents: ConsumedEventService
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

  getHealthState(): Readonly<{
    ready: boolean
    groupJoined: boolean
    stoppedUnexpectedly: boolean
    lastProcessedAt: string | null
  }> {
    return {
      ready: this.groupJoined && !this.stoppedUnexpectedly,
      groupJoined: this.groupJoined,
      stoppedUnexpectedly: this.stoppedUnexpectedly,
      lastProcessedAt: this.lastProcessedAt?.toISOString() ?? null
    }
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

    this.consumer.on(this.consumer.events.GROUP_JOIN, event => {
      this.groupJoined = true
      this.logger.log(
        `Joined consumer group ${event.payload.groupId} as member ${event.payload.memberId}`,
        KafkaConsumerService.name
      )
      this.readyResolve?.()
      this.readyResolve = undefined
    })

    const handler: KafkaMessageHandler = async (event, context) => {
      await this.consumedEvents.processOnce(event, context, () =>
        this.dispatcher.dispatch(event, context)
      )
      this.lastProcessedAt = new Date()
    }

    this.runPromise = runConsumer(this.consumer, ALL_KAFKA_TOPICS, handler, {
      malformedMessagePolicy: 'skip',
      onMalformedMessage: (error, context) => {
        this.logger.error(
          `Malformed Kafka message skipped at ${context.topic}:${context.partition}:${context.offset}`,
          error
        )
      }
    }).catch(error => {
      this.stoppedUnexpectedly = true
      this.groupJoined = false
      this.logger.error('Kafka consumer stopped unexpectedly', error)
      throw error
    })
  }
}
