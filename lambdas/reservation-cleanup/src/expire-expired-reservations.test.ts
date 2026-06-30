import { describe, expect, it, vi } from 'vitest'

import type { ExpiredReservationRepository } from './repositories/expired-reservation.repository.js'

import { expireExpiredReservations } from './expire-expired-reservations.js'
import type { EventBridgeNotificationPublisher } from './publishers/eventbridge-notification.publisher.js'
import type { KafkaReservationPublisher } from './publishers/kafka-reservation.publisher.js'
import type { ReservationCleanupEnv } from './read-env.js'
import type { ParkingRedisStore } from './redis/parking-redis.store.js'

const baseEnv: ReservationCleanupEnv = {
  eventBridgeBusName: 'polaris-events',
  eventBridgeSource: 'polaris.reservation-cleanup',
  kafkaClientId: 'reservation-cleanup-test',
  redisUrl: 'redis://localhost:6379'
}

describe('expireExpiredReservations', () => {
  it('returns zero when no reservations are expired', async () => {
    const result = await expireExpiredReservations(new Date(), {
      env: baseEnv,
      reservations: {
        findExpiredActive: vi.fn().mockResolvedValue([]),
        persistExpiration: vi.fn()
      } as unknown as ExpiredReservationRepository,
      redis: {
        markSpotFree: vi.fn()
      } as unknown as ParkingRedisStore,
      kafkaPublisher: {
        publishExpired: vi.fn()
      } as unknown as KafkaReservationPublisher,
      eventBridgePublisher: {
        publishExpired: vi.fn()
      } as unknown as EventBridgeNotificationPublisher
    })

    expect(result.expiredCount).toBe(0)
  })
})
