import {
  expireReservation,
  isBusinessRuleViolationError
} from '@polaris/domain'

import { ExpiredReservationRepository } from './repositories/expired-reservation.repository.js'

import { EventBridgeNotificationPublisher } from './publishers/eventbridge-notification.publisher.js'
import { KafkaReservationPublisher } from './publishers/kafka-reservation.publisher.js'
import type { ReservationCleanupEnv } from './read-env.js'
import { ParkingRedisStore } from './redis/parking-redis.store.js'

export type ReservationCleanupResponse = Readonly<{
  scannedAt: string
  expiredCount: number
  reservationIds: string[]
}>

export type ExpireExpiredReservationsDependencies = Readonly<{
  env: ReservationCleanupEnv
  reservations: ExpiredReservationRepository
  redis: ParkingRedisStore
  kafkaPublisher: KafkaReservationPublisher
  eventBridgePublisher: EventBridgeNotificationPublisher
}>

export const createExpireExpiredReservationsDependencies = (
  env: ReservationCleanupEnv
): ExpireExpiredReservationsDependencies => ({
  env,
  reservations: new ExpiredReservationRepository(),
  redis: new ParkingRedisStore(env.redisUrl),
  kafkaPublisher: new KafkaReservationPublisher(env.kafkaClientId),
  eventBridgePublisher: new EventBridgeNotificationPublisher(env)
})

export const expireExpiredReservations = async (
  at: Date,
  deps: ExpireExpiredReservationsDependencies
): Promise<ReservationCleanupResponse> => {
  const candidates = await deps.reservations.findExpiredActive(at)
  const reservationIds: string[] = []

  for (const reservation of candidates) {
    try {
      const expired = expireReservation(reservation, at)
      const row = await deps.reservations.persistExpiration(expired)
      await deps.redis.markSpotFree(row.parkingSpotId)
      await deps.kafkaPublisher.publishExpired(row)
      await deps.eventBridgePublisher.publishExpired(row)
      reservationIds.push(row.reservationId)
    } catch (error) {
      if (isBusinessRuleViolationError(error)) {
        continue
      }

      throw error
    }
  }

  return {
    scannedAt: at.toISOString(),
    expiredCount: reservationIds.length,
    reservationIds
  }
}
