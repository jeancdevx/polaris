import { Injectable } from '@nestjs/common'

import type { KafkaMessageContext, ParsedKafkaEvent } from '@polaris/kafka'
import { KAFKA_TOPICS, type KafkaTopic } from '@polaris/shared-types'

/** Topic handlers (Redis/RDS/EventBridge) se implementan en Fase 5.2+. */
@Injectable()
export class EventDispatcherService {
  private readonly processedByTopic = new Map<KafkaTopic, number>()

  async dispatch(
    _event: ParsedKafkaEvent,
    context: KafkaMessageContext
  ): Promise<void> {
    const current = this.processedByTopic.get(context.topic) ?? 0
    this.processedByTopic.set(context.topic, current + 1)
  }

  getProcessedCount(topic: KafkaTopic): number {
    return this.processedByTopic.get(topic) ?? 0
  }

  getTotalProcessed(): number {
    let total = 0
    for (const topic of Object.values(KAFKA_TOPICS)) {
      total += this.getProcessedCount(topic)
    }
    return total
  }

  hasProcessedAllTopics(): boolean {
    return Object.values(KAFKA_TOPICS).every(
      topic => this.getProcessedCount(topic) > 0
    )
  }
}
