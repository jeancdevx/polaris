import { describe, expect, it } from 'vitest'

import type { ParkingStatus } from '@polaris/shared-types'

import { mergeOccupancyChange } from './occupancy.js'

const baseStatus: ParkingStatus = {
  totalSpots: 2,
  totalAvailable: 1,
  totalOccupied: 1,
  totalReserved: 0,
  totalVisitors: 0,
  updatedAt: '2025-06-19T12:00:00.000Z',
  spots: [
    { spotId: 'spot-01', zone: 'a', status: 'free' },
    { spotId: 'spot-02', zone: 'a', status: 'occupied' }
  ]
}

describe('mergeOccupancyChange', () => {
  it('updates the matching spot and recomputes totals', () => {
    const next = mergeOccupancyChange(baseStatus, {
      spotId: 'spot-01',
      zone: 'a',
      status: 'occupied',
      occurredAt: '2025-06-19T12:05:00.000Z'
    })

    expect(next.spots[0]?.status).toBe('occupied')
    expect(next.totalAvailable).toBe(0)
    expect(next.totalOccupied).toBe(2)
    expect(next.updatedAt).toBe('2025-06-19T12:05:00.000Z')
  })
})
