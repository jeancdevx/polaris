import { describe, expect, it } from 'vitest'

import {
  buildParkingStatus,
  mapParkingSpotRow,
  mapRedisHashToParkingSpot,
  occupiedSinceToSeconds
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

  it('converts epoch milliseconds to seconds for AppSync Int', () => {
    const at = new Date('2026-07-10T02:00:00.000Z')
    const seconds = Math.floor(at.getTime() / 1000)

    expect(occupiedSinceToSeconds(at)).toBe(seconds)
    expect(occupiedSinceToSeconds(String(at.getTime()))).toBe(seconds)
    expect(occupiedSinceToSeconds(String(seconds))).toBe(seconds)
    expect(seconds).toBeLessThan(2_147_483_647)
  })

  it('maps RDS occupiedSince as Unix seconds', () => {
    const at = new Date('2026-07-10T02:00:00.000Z')
    const spot = mapParkingSpotRow({
      spotId: 'spot-01',
      zone: 'a',
      status: 'occupied',
      occupiedSince: at
    } as never)

    expect(spot.occupiedSince).toBe(Math.floor(at.getTime() / 1000))
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
