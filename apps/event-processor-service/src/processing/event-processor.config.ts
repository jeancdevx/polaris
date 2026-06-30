import { registerAs } from '@nestjs/config'

export type EventProcessorConfig = {
  clientId: string
  consumerGroupId: string
  redisUrl: string
}

export const EVENT_PROCESSOR_CONFIG_KEY = 'eventProcessor'

export const eventProcessorConfig = registerAs(
  EVENT_PROCESSOR_CONFIG_KEY,
  (): EventProcessorConfig => ({
    clientId: process.env.KAFKA_CLIENT_ID ?? 'event-processor-service',
    consumerGroupId:
      process.env.KAFKA_CONSUMER_GROUP_ID ?? 'event-processor-service',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379'
  })
)
