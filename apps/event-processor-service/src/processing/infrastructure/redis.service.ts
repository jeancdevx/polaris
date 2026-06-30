import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, type RedisClientType } from 'redis'

import {
  EVENT_PROCESSOR_CONFIG_KEY,
  type EventProcessorConfig
} from '../event-processor.config.js'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: RedisClientType | undefined
  private connectPromise: Promise<RedisClientType> | undefined

  constructor(private readonly configService: ConfigService) {}

  async getClient(): Promise<RedisClientType> {
    if (this.client?.isOpen) {
      return this.client
    }

    if (!this.connectPromise) {
      this.connectPromise = this.connect()
    }

    return this.connectPromise
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit()
    }
  }

  private async connect(): Promise<RedisClientType> {
    const config = this.configService.getOrThrow<EventProcessorConfig>(
      EVENT_PROCESSOR_CONFIG_KEY
    )

    const client = createClient({ url: config.redisUrl })
    await client.connect()
    this.client = client
    return client
  }
}
