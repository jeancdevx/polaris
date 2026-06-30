import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MetricsRepository } from './metrics.repository.js'
import { MetricsService } from './metrics.service.js'
import { ParkingStatusReader } from './parking-status.reader.js'

describe('MetricsService', () => {
  const parkingStatusReader = {
    getParkingStatus: vi.fn()
  } as unknown as ParkingStatusReader

  const metricsRepository = {
    countReservations: vi.fn(),
    countUsers: vi.fn(),
    summarizeAuditEvents: vi.fn()
  } as unknown as MetricsRepository

  const service = new MetricsService(parkingStatusReader, metricsRepository)

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('aggregates occupancy and operational metrics', async () => {
    vi.mocked(parkingStatusReader.getParkingStatus).mockResolvedValue({
      totalSpots: 2,
      totalAvailable: 1,
      totalOccupied: 1,
      totalReserved: 0,
      totalVisitors: 0,
      updatedAt: '2025-06-19T14:00:00.000Z',
      spots: [
        {
          spotId: 'spot-01',
          zone: 'a',
          status: 'free'
        },
        {
          spotId: 'spot-06',
          zone: 'b',
          status: 'occupied',
          userId: 'usr-12345'
        }
      ]
    })

    vi.mocked(metricsRepository.countReservations).mockResolvedValue({
      active: 2,
      checkedIn: 1,
      cancelledInRange: 0,
      expiredInRange: 1
    })
    vi.mocked(metricsRepository.countUsers).mockResolvedValue({
      active: 3,
      inactive: 1
    })
    vi.mocked(metricsRepository.summarizeAuditEvents).mockResolvedValue({
      totalInRange: 2,
      byEventType: {
        'vehicle.entry': 1,
        'vehicle.exit': 1
      }
    })

    const result = await service.getMetrics({
      from: new Date('2025-06-19T00:00:00.000Z'),
      to: new Date('2025-06-19T23:59:59.999Z')
    })

    expect(result.occupancy.totalSpots).toBe(2)
    expect(result.occupancy.zones).toHaveLength(2)
    expect(result.reservations.active).toBe(2)
    expect(result.audit.byEventType['vehicle.entry']).toBe(1)
  })

  it('filters occupancy by zone', async () => {
    vi.mocked(parkingStatusReader.getParkingStatus).mockResolvedValue({
      totalSpots: 2,
      totalAvailable: 1,
      totalOccupied: 1,
      totalReserved: 0,
      totalVisitors: 0,
      updatedAt: '2025-06-19T14:00:00.000Z',
      spots: [
        { spotId: 'spot-01', zone: 'a', status: 'free' },
        { spotId: 'spot-06', zone: 'b', status: 'occupied' }
      ]
    })
    vi.mocked(metricsRepository.countReservations).mockResolvedValue({
      active: 0,
      checkedIn: 0,
      cancelledInRange: 0,
      expiredInRange: 0
    })
    vi.mocked(metricsRepository.countUsers).mockResolvedValue({
      active: 0,
      inactive: 0
    })
    vi.mocked(metricsRepository.summarizeAuditEvents).mockResolvedValue({
      totalInRange: 0,
      byEventType: {}
    })

    const result = await service.getMetrics({
      zone: 'a',
      from: new Date('2025-06-19T00:00:00.000Z'),
      to: new Date('2025-06-19T23:59:59.999Z')
    })

    expect(result.occupancy.totalSpots).toBe(1)
    expect(result.occupancy.zones).toEqual([
      {
        zone: 'a',
        totalSpots: 1,
        totalAvailable: 1,
        totalOccupied: 0,
        totalReserved: 0
      }
    ])
  })
})
