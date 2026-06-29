import { ConflictException } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RedisService } from './redis.service.js'
import { reservationConfig } from './reservation.config.js'
import { ReservationRepository } from './reservation.repository.js'
import { ReservationService } from './reservation.service.js'

describe('ReservationService', () => {
  let service: ReservationService
  let repository: {
    insertActiveReservation: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
    persistCancellation: ReturnType<typeof vi.fn>
  }
  let redisClient: {
    set: ReturnType<typeof vi.fn>
    del: ReturnType<typeof vi.fn>
    hGet: ReturnType<typeof vi.fn>
    multi: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    redisClient = {
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      hGet: vi.fn().mockResolvedValue('free'),
      multi: vi.fn().mockReturnValue({
        hSet: vi.fn().mockReturnThis(),
        decr: vi.fn().mockReturnThis(),
        incr: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([])
      })
    }

    repository = {
      insertActiveReservation: vi.fn().mockResolvedValue({
        reservationId: 'res-test0001',
        userId: 'usr-12345',
        parkingSpotId: 'spot-07',
        status: 'active',
        reservationDate: new Date('2025-06-19T14:00:00.000Z'),
        createdAt: new Date('2025-06-19T10:00:00.000Z'),
        expiresAt: new Date('2025-06-19T16:00:00.000Z')
      }),
      findById: vi.fn(),
      persistCancellation: vi.fn()
    }

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [reservationConfig] })],
      providers: [
        ReservationService,
        {
          provide: RedisService,
          useValue: {
            getClient: vi.fn().mockResolvedValue(redisClient)
          }
        },
        {
          provide: ReservationRepository,
          useValue: repository
        }
      ]
    }).compile()

    service = moduleRef.get(ReservationService)
  })

  it('creates a reservation when lock and spot are available', async () => {
    const reservation = await service.create('usr-12345', {
      parkingSpotId: 'spot-07',
      reservationDate: '2025-06-19T14:00:00.000Z'
    })

    expect(reservation.reservationId).toBe('res-test0001')
    expect(reservation.parkingSpotId).toBe('spot-07')
    expect(repository.insertActiveReservation).toHaveBeenCalledOnce()
    expect(redisClient.del).toHaveBeenCalledWith('parking:lock:spot-07')
  })

  it('returns conflict when lock cannot be acquired', async () => {
    redisClient.set.mockResolvedValue(null)

    await expect(
      service.create('usr-12345', {
        parkingSpotId: 'spot-07',
        reservationDate: '2025-06-19T14:00:00.000Z'
      })
    ).rejects.toBeInstanceOf(ConflictException)
  })
})
