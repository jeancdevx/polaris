import { registerAs } from '@nestjs/config'

import {
  EVENTBRIDGE_DEFAULT_BUS_NAME,
  EVENTBRIDGE_SOURCE_EVENT_PROCESSOR
} from '@polaris/eventbridge'

export type EventProcessorConfig = {
  clientId: string
  consumerGroupId: string
  redisUrl: string
  eventBridgeEnabled: boolean
  eventBridgeBusName: string
  eventBridgeRegion: string
  eventBridgeEndpoint?: string
  eventBridgeSource: string
  iotDataEndpoint?: string
  ledCommandsEnabled: boolean
}

export const EVENT_PROCESSOR_CONFIG_KEY = 'eventProcessor'

export const eventProcessorConfig = registerAs(
  EVENT_PROCESSOR_CONFIG_KEY,
  (): EventProcessorConfig => ({
    clientId: process.env.KAFKA_CLIENT_ID ?? 'event-processor-service',
    consumerGroupId:
      process.env.KAFKA_CONSUMER_GROUP_ID ?? 'event-processor-service',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    eventBridgeEnabled: process.env.EVENTBRIDGE_ENABLED !== 'false',
    eventBridgeBusName:
      process.env.EVENTBRIDGE_BUS_NAME ?? EVENTBRIDGE_DEFAULT_BUS_NAME,
    eventBridgeRegion:
      process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1',
    eventBridgeEndpoint:
      process.env.AWS_ENDPOINT_URL ?? process.env.LOCALSTACK_ENDPOINT,
    eventBridgeSource:
      process.env.EVENTBRIDGE_SOURCE ?? EVENTBRIDGE_SOURCE_EVENT_PROCESSOR,
    iotDataEndpoint: process.env.IOT_DATA_ENDPOINT,
    ledCommandsEnabled: process.env.LED_COMMANDS_ENABLED === 'true'
  })
)
