import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { ReservationCancelledHandler } from './handlers/reservation-cancelled.handler.js'
import { ReservationCreatedHandler } from './handlers/reservation-created.handler.js'
import { SensorOccupancyHandler } from './handlers/sensor-occupancy.handler.js'
import { VehicleEntryHandler } from './handlers/vehicle-entry.handler.js'
import { VehicleExitHandler } from './handlers/vehicle-exit.handler.js'

import { EventDispatcherService } from './event-dispatcher.service.js'
import { eventProcessorConfig } from './event-processor.config.js'
import { DatabaseService } from './infrastructure/database.service.js'
import { EventBridgePublisherService } from './infrastructure/eventbridge-publisher.service.js'
import { RedisService } from './infrastructure/redis.service.js'
import { KafkaConsumerService } from './kafka-consumer.service.js'
import { ParkingRedisStore } from './parking/parking-redis.store.js'
import { ParkingRepository } from './parking/parking.repository.js'

@Module({
  imports: [ConfigModule.forFeature(eventProcessorConfig)],
  providers: [
    DatabaseService,
    RedisService,
    EventBridgePublisherService,
    ParkingRepository,
    ParkingRedisStore,
    VehicleEntryHandler,
    VehicleExitHandler,
    SensorOccupancyHandler,
    ReservationCreatedHandler,
    ReservationCancelledHandler,
    EventDispatcherService,
    KafkaConsumerService
  ],
  exports: [EventDispatcherService, KafkaConsumerService]
})
export class EventProcessorModule {}
