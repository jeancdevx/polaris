import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import {
  connectRedis,
  disconnectRedis,
  type PolarisRedisClient
} from '@polaris/shared-utils'

import { METRICS_CONFIG_KEY, type MetricsConfig } from './metrics.config.js'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: PolarisRedisClient | undefined
  private connectPromise: Promise<PolarisRedisClient> | undefined

  constructor(private readonly configService: ConfigService) {}

  async getClient(): Promise<PolarisRedisClient> {
    if (this.client?.isOpen) {
      return this.client
    }

    if (!this.connectPromise) {
      this.connectPromise = this.connect()
    }

    return this.connectPromise
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await disconnectRedis(this.client)
    }
  }

  private async connect(): Promise<PolarisRedisClient> {
    const config =
      this.configService.getOrThrow<MetricsConfig>(METRICS_CONFIG_KEY)

    const client = await connectRedis(config.redisUrl)
    this.client = client
    return client
  }
}
