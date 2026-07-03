import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseService } from './database.service.js'
import { KafkaProducerService } from './kafka-producer.service.js'
import { RedisService } from './redis.service.js'
import { ReservationEventPublisher } from './reservation-event.publisher.js'
import { reservationConfig } from './reservation.config.js'
import { ReservationController } from './reservation.controller.js'
import { ReservationRepository } from './reservation.repository.js'
import { ReservationService } from './reservation.service.js'

@Module({
  imports: [ConfigModule.forFeature(reservationConfig)],
  controllers: [ReservationController],
  providers: [
    RedisService,
    DatabaseService,
    KafkaProducerService,
    ReservationEventPublisher,
    ReservationRepository,
    ReservationService
  ]
})
export class ReservationModule {}
