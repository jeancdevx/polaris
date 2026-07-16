import { describe, expect, it, vi } from 'vitest'

import {
  createReservationId,
  createSpotId,
  createUserId,
  restoreReservation
} from '@polaris/domain'

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

  it('persists expiration before projecting the freed spot', async () => {
    const expiredAt = new Date('2026-07-15T12:00:00.000Z')
    const reservation = restoreReservation({
      reservationId: createReservationId('res-expired01'),
      userId: createUserId('usr-12345'),
      parkingSpotId: createSpotId('spot-03'),
      status: 'active',
      reservationDate: new Date('2026-07-15T10:00:00.000Z'),
      createdAt: new Date('2026-07-15T09:00:00.000Z'),
      expiresAt: new Date('2026-07-15T11:00:00.000Z')
    })
    const persistExpiration = vi.fn().mockResolvedValue({
      reservationId: 'res-expired01',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      status: 'expired',
      reservationDate: reservation.reservationDate,
      expiresAt: reservation.expiresAt,
      expiredAt,
      createdAt: reservation.createdAt
    })
    const markSpotFree = vi.fn()
    const publishExpired = vi.fn()

    const result = await expireExpiredReservations(expiredAt, {
      env: baseEnv,
      reservations: {
        findExpiredActive: vi.fn().mockResolvedValue([reservation]),
        persistExpiration
      } as unknown as ExpiredReservationRepository,
      redis: { markSpotFree } as unknown as ParkingRedisStore,
      kafkaPublisher: {
        publishExpired
      } as unknown as KafkaReservationPublisher,
      eventBridgePublisher: {
        publishExpired: vi.fn()
      } as unknown as EventBridgeNotificationPublisher
    })

    expect(result.reservationIds).toEqual(['res-expired01'])
    expect(persistExpiration).toHaveBeenCalledOnce()
    expect(markSpotFree).toHaveBeenCalledWith('spot-03')
    expect(persistExpiration.mock.invocationCallOrder[0]).toBeLessThan(
      markSpotFree.mock.invocationCallOrder[0] ?? 0
    )
    expect(publishExpired).not.toHaveBeenCalled()
  })
})
