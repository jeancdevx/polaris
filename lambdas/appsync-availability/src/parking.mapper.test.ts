import { describe, expect, it } from 'vitest'

import {
  buildParkingStatus,
  mapRedisHashToParkingSpot
} from './parking.mapper.js'

describe('parking.mapper', () => {
  it('maps redis hash to parking spot', () => {
    expect(
      mapRedisHashToParkingSpot('spot-01', {
        status: 'occupied',
        userId: 'usr-1'
      })
    ).toEqual({
      spotId: 'spot-01',
      zone: 'a',
      status: 'occupied',
      userId: 'usr-1',
      reservationId: undefined,
      occupiedSince: undefined
    })
  })

  it('builds parking status aggregates', () => {
    const status = buildParkingStatus([
      { spotId: 'spot-02', zone: 'a', status: 'free' },
      { spotId: 'spot-01', zone: 'a', status: 'occupied' }
    ])

    expect(status.totalSpots).toBe(2)
    expect(status.totalAvailable).toBe(1)
    expect(status.totalOccupied).toBe(1)
    expect(status.spots.map(spot => spot.spotId)).toEqual([
      'spot-01',
      'spot-02'
    ])
  })
})
