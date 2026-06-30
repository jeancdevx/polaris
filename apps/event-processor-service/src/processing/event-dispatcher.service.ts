import { Injectable, Logger } from '@nestjs/common'

import type {
  KafkaMessageContext,
  OccupancyChangedEvent,
  ParsedKafkaEvent,
  VehicleEntryEvent,
  VehicleExitEvent
} from '@polaris/kafka'
import { KAFKA_TOPICS, type KafkaTopic } from '@polaris/shared-types'

import { SensorOccupancyHandler } from './handlers/sensor-occupancy.handler.js'
import { VehicleEntryHandler } from './handlers/vehicle-entry.handler.js'
import { VehicleExitHandler } from './handlers/vehicle-exit.handler.js'

@Injectable()
export class EventDispatcherService {
  private readonly logger = new Logger(EventDispatcherService.name)
  private readonly processedByTopic = new Map<KafkaTopic, number>()

  constructor(
    private readonly vehicleEntryHandler: VehicleEntryHandler,
    private readonly vehicleExitHandler: VehicleExitHandler,
    private readonly sensorOccupancyHandler: SensorOccupancyHandler
  ) {}

  async dispatch(
    event: ParsedKafkaEvent,
    context: KafkaMessageContext
  ): Promise<void> {
    switch (context.topic) {
      case KAFKA_TOPICS.VEHICLE_ENTRY:
        await this.vehicleEntryHandler.handle(event as VehicleEntryEvent)
        break
      case KAFKA_TOPICS.VEHICLE_EXIT:
        await this.vehicleExitHandler.handle(event as VehicleExitEvent)
        break
      case KAFKA_TOPICS.SENSOR_OCCUPANCY:
        await this.sensorOccupancyHandler.handle(event as OccupancyChangedEvent)
        break
      default:
        this.logger.debug(`No handler for topic ${context.topic} (phase 5.2+)`)
        break
    }

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
