import { describe, expect, it } from 'vitest'

import type { ParkingStatus } from '@/lib/types'

import {
  findMyReservedSpot,
  mergeOccupancyChange,
  parkingZoneFromSpotId
} from './occupancy'

const baseStatus: ParkingStatus = {
  totalSpots: 3,
  totalAvailable: 1,
  totalOccupied: 1,
  totalReserved: 1,
  totalVisitors: 0,
  updatedAt: '2025-06-19T12:00:00.000Z',
  spots: [
    { spotId: 'spot-01', zone: 'a', status: 'free' },
    { spotId: 'spot-02', zone: 'a', status: 'occupied', userId: 'usr-2' },
    {
      spotId: 'spot-07',
      zone: 'b',
      status: 'reserved',
      userId: 'usr-1',
      reservationId: 'res-007'
    }
  ]
}

describe('parkingZoneFromSpotId', () => {
  it('maps spots 1-5 to zone a and 6+ to zone b', () => {
    expect(parkingZoneFromSpotId('spot-01')).toBe('a')
    expect(parkingZoneFromSpotId('spot-05')).toBe('a')
    expect(parkingZoneFromSpotId('spot-06')).toBe('b')
    expect(parkingZoneFromSpotId('spot-10')).toBe('b')
  })
})

describe('mergeOccupancyChange', () => {
  it('updates the spot and recomputes totals', () => {
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

  it('clears user data when a spot becomes free (Flujo 11)', () => {
    const next = mergeOccupancyChange(baseStatus, {
      spotId: 'spot-02',
      zone: 'a',
      status: 'free',
      occurredAt: '2025-06-19T12:06:00.000Z'
    })

    expect(next.spots[1]?.status).toBe('free')
    expect(next.spots[1]?.userId).toBeUndefined()
  })
})

describe('findMyReservedSpot', () => {
  it('finds the reserved spot belonging to the user', () => {
    const spot = findMyReservedSpot(baseStatus, 'usr-1')
    expect(spot?.spotId).toBe('spot-07')
  })

  it('returns undefined for users without reservation', () => {
    expect(findMyReservedSpot(baseStatus, 'usr-999')).toBeUndefined()
    expect(findMyReservedSpot(null, 'usr-1')).toBeUndefined()
  })
})
