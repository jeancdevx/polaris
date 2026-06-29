import { beforeEach, describe, expect, it, vi } from 'vitest'

import { KAFKA_TOPICS } from '@polaris/shared-types'

import { KafkaProducerService } from './kafka-producer.service.js'
import { ReservationEventPublisher } from './reservation-event.publisher.js'

describe('ReservationEventPublisher', () => {
  let publisher: ReservationEventPublisher
  let send: ReturnType<typeof vi.fn>

  beforeEach(() => {
    send = vi.fn().mockResolvedValue([])

    publisher = new ReservationEventPublisher({
      getProducer: vi.fn().mockResolvedValue({ send })
    } as unknown as KafkaProducerService)
  })

  it('publishes reservation.created', async () => {
    await publisher.publishCreated({
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-07',
      status: 'active',
      reservationDate: '2025-06-19T14:00:00.000Z',
      createdAt: '2025-06-19T10:00:00.000Z',
      expiresAt: '2025-06-19T16:00:00.000Z'
    })

    expect(send).toHaveBeenCalledOnce()
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      topic: KAFKA_TOPICS.RESERVATION_CREATED,
      messages: [
        {
          key: 'res-001',
          value: expect.stringContaining('"reservationId":"res-001"')
        }
      ]
    })
  })

  it('publishes reservation.cancelled', async () => {
    await publisher.publishCancelled({
      reservationId: 'res-001',
      userId: 'usr-12345',
      parkingSpotId: 'spot-07',
      status: 'cancelled',
      reservationDate: '2025-06-19T14:00:00.000Z',
      createdAt: '2025-06-19T10:00:00.000Z',
      expiresAt: '2025-06-19T16:00:00.000Z',
      cancelledAt: '2025-06-19T11:00:00.000Z'
    })

    expect(send).toHaveBeenCalledOnce()
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      topic: KAFKA_TOPICS.RESERVATION_CANCELLED,
      messages: [
        {
          key: 'res-001',
          value: expect.stringContaining('"reason":"user_cancelled"')
        }
      ]
    })
  })
})
