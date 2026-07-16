import { Injectable } from '@nestjs/common'

import { processConsumedEventOnce } from '@polaris/database'
import type { KafkaMessageContext, ParsedKafkaEvent } from '@polaris/kafka'

import { DatabaseService } from './infrastructure/database.service.js'

@Injectable()
export class ConsumedEventService {
  constructor(private readonly database: DatabaseService) {}

  async processOnce(
    event: ParsedKafkaEvent,
    context: KafkaMessageContext,
    handler: () => Promise<void>
  ): Promise<'processed' | 'duplicate'> {
    const suppliedEventId = (event as unknown as { eventId?: unknown }).eventId
    const eventId =
      typeof suppliedEventId === 'string'
        ? suppliedEventId
        : `${context.topic}:${context.partition}:${context.offset}`

    return processConsumedEventOnce(
      await this.database.getDataSource(),
      {
        consumerName: 'event-processor-service',
        eventId,
        topic: context.topic,
        partition: context.partition,
        offset: context.offset
      },
      handler
    )
  }
}
