export type HealthCheckerEnv = {
  readonly redisUrl: string
  readonly snsTopicArn?: string
  readonly alertsEnabled: boolean
}

export const readHealthCheckerEnv = (): HealthCheckerEnv => ({
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  snsTopicArn: process.env.SNS_ALERTS_TOPIC_ARN,
  alertsEnabled: process.env.HEALTH_ALERTS_ENABLED !== 'false'
})
