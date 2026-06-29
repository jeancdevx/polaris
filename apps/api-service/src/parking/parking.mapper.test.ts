import { describe, expect, it } from 'vitest'

import {
  buildParkingStatus,
  mapParkingSpotRow,
  mapRedisHashToParkingSpot,
  parkingZoneFromSpotId
} from './parking.mapper.js'

describe('parking mapper', () => {
  it('derives zone from spot id', () => {
    expect(parkingZoneFromSpotId('spot-01')).toBe('a')
    expect(parkingZoneFromSpotId('spot-06')).toBe('b')
  })

  it('maps redis hash to parking spot', () => {
    expect(
      mapRedisHashToParkingSpot('spot-03', {
        status: 'reserved',
        userId: 'usr-12345',
        reservationId: 'res-001'
      })
    ).toEqual({
      spotId: 'spot-03',
      zone: 'a',
      status: 'reserved',
      userId: 'usr-12345',
      reservationId: 'res-001',
      occupiedSince: undefined
    })
  })

  it('builds parking status aggregates', () => {
    const status = buildParkingStatus([
      {
        spotId: 'spot-02',
        zone: 'a',
        status: 'free'
      },
      {
        spotId: 'spot-01',
        zone: 'a',
        status: 'occupied'
      },
      {
        spotId: 'spot-03',
        zone: 'a',
        status: 'reserved'
      }
    ])

    expect(status.totalSpots).toBe(3)
    expect(status.totalAvailable).toBe(1)
    expect(status.totalOccupied).toBe(1)
    expect(status.totalReserved).toBe(1)
    expect(status.totalVisitors).toBe(0)
    expect(status.spots.map(spot => spot.spotId)).toEqual([
      'spot-01',
      'spot-02',
      'spot-03'
    ])
  })

  it('maps database rows', () => {
    expect(
      mapParkingSpotRow({
        spotId: 'spot-04',
        zone: 'a',
        status: 'free',
        updatedAt: new Date('2025-06-19T10:00:00.000Z')
      })
    ).toEqual({
      spotId: 'spot-04',
      zone: 'a',
      status: 'free',
      userId: undefined,
      reservationId: undefined,
      occupiedSince: undefined
    })
  })
})
