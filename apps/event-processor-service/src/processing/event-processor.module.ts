import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { eventProcessorConfig } from './event-processor.config.js'
import { EventDispatcherService } from './event-dispatcher.service.js'
import { KafkaConsumerService } from './kafka-consumer.service.js'

@Module({
  imports: [ConfigModule.forFeature(eventProcessorConfig)],
  providers: [EventDispatcherService, KafkaConsumerService],
  exports: [EventDispatcherService, KafkaConsumerService]
})
export class EventProcessorModule {}
