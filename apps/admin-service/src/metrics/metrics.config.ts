import { registerAs } from '@nestjs/config'

export type MetricsConfig = {
  redisUrl: string
}

export const METRICS_CONFIG_KEY = 'metrics'

export const metricsConfig = registerAs(
  METRICS_CONFIG_KEY,
  (): MetricsConfig => ({
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379'
  })
)
