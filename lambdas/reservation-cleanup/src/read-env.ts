export type ReservationCleanupEnv = Readonly<{
  eventBridgeBusName: string
  eventBridgeSource: string
  kafkaClientId: string
  redisUrl: string
}>

export const readReservationCleanupEnv = (): ReservationCleanupEnv => ({
  eventBridgeBusName: process.env.EVENTBRIDGE_BUS_NAME ?? 'polaris-events',
  eventBridgeSource:
    process.env.EVENTBRIDGE_SOURCE ?? 'polaris.reservation-cleanup',
  kafkaClientId: process.env.KAFKA_CLIENT_ID ?? 'reservation-cleanup',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379'
})
