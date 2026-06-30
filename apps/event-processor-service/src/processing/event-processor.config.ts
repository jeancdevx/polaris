import { registerAs } from '@nestjs/config'

export const eventProcessorConfig = registerAs('eventProcessor', () => ({
  clientId: process.env.KAFKA_CLIENT_ID ?? 'event-processor-service',
  consumerGroupId:
    process.env.KAFKA_CONSUMER_GROUP_ID ?? 'event-processor-service'
}))
