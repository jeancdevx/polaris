import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { EntryProximityHandler } from './handlers/entry-proximity.handler.js'
import { ReservationCancelledHandler } from './handlers/reservation-cancelled.handler.js'
import { ReservationCreatedHandler } from './handlers/reservation-created.handler.js'
import { RfidValidationHandler } from './handlers/rfid-validation.handler.js'
import { SensorOccupancyHandler } from './handlers/sensor-occupancy.handler.js'
import { VehicleEntryHandler } from './handlers/vehicle-entry.handler.js'
import { VehicleExitHandler } from './handlers/vehicle-exit.handler.js'
import { WalkInSessionHandler } from './handlers/walk-in-session.handler.js'

import { EventDispatcherService } from './event-dispatcher.service.js'
import { eventProcessorConfig } from './event-processor.config.js'
import { AuditLogRepository } from './infrastructure/audit-log.repository.js'
import { DatabaseService } from './infrastructure/database.service.js'
import { EventBridgePublisherService } from './infrastructure/eventbridge-publisher.service.js'
import { IotLedCommandPublisher } from './infrastructure/iot-led-command.publisher.js'
import { LedStateSyncService } from './infrastructure/led-state-sync.service.js'
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
    IotLedCommandPublisher,
    LedStateSyncService,
    AuditLogRepository,
    ParkingRepository,
    ParkingRedisStore,
    VehicleEntryHandler,
    VehicleExitHandler,
    SensorOccupancyHandler,
    ReservationCreatedHandler,
    ReservationCancelledHandler,
    RfidValidationHandler,
    WalkInSessionHandler,
    EntryProximityHandler,
    EventDispatcherService,
    KafkaConsumerService
  ],
  exports: [EventDispatcherService, KafkaConsumerService]
})
export class EventProcessorModule {}
